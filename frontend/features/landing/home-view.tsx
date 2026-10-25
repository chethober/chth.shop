'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/page-container'
import { STUDIO_FRAME_CLASS, handOffToStudio } from '@/features/design/handoff'
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme'
import { cn } from '@/lib/utils'
import { COLORWAYS, DEFAULT_COLORWAY, SECTION_IDS, type Colorway, type SectionId } from './content'
import { ScrollHint } from './scroll-hint'
import { TeeLoader } from './tee-loader'
import { CollabSection } from './sections/collab-section'
import { DesignSection } from './sections/design-section'
import { HeroSection } from './sections/hero-section'

// WebGL can't render on the server.
const LandingScene = dynamic(() => import('./landing-scene'), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-start justify-center pt-[18svh] lg:items-center lg:justify-end lg:pr-[22%] lg:pt-0">
      <TeeLoader progress={0} />
    </div>
  ),
})

function scrollToSection(id: SectionId) {
  // Land on the section's snap point so scroll snapping doesn't pull the page afterwards.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

/**
 * Three-part landing page (the tee → for artists → design studio). The page snaps section by
 * section; one 3D tee floats behind them all and swings to a fixed pose for each, with a tip
 * pinned to it. The design section's button opens the design studio:
 * the page gives way to a copy of the studio's frame, the tee flies into it, and the studio
 * takes over the same tee.
 */
export function HomeView() {
  const router = useRouter()
  const tipsRef = useRef<HTMLDivElement>(null)
  const studioFrameRef = useRef<HTMLDivElement>(null)
  const launched = useRef(false)

  // Until the visitor picks a swatch, the tee contrasts with the current theme.
  const isDark = useIsDarkTheme()
  const [chosenColorway, setColorway] = useState<Colorway | null>(null)
  const colorway =
    chosenColorway ?? COLORWAYS.find((c) => c.name === DEFAULT_COLORWAY[isDark ? 'dark' : 'light']) ?? COLORWAYS[0]
  // Artwork dropped in the design section, as a data URL: printed on the tee and carried into the studio.
  const [artwork, setArtwork] = useState<string | null>(null)
  const [section, setSection] = useState<SectionId>('hero')
  const [launching, setLaunching] = useState(false)

  // The section crossing the middle of the screen is the one in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((e) => e.isIntersecting)
        if (entry) setSection(entry.target.id as SectionId)
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  const openStudio = useCallback(() => {
    if (launched.current) return
    launched.current = true
    // Load the studio while the tee is in flight, so it's ready to take over.
    router.prefetch('/design')
    void import('@/features/design/scene/studio-canvas')
    setLaunching(true)
  }, [router])

  const enterStudio = useCallback(
    (snapshot: HTMLCanvasElement) => {
      handOffToStudio({ color: colorway.hex, logoUrl: artwork ?? undefined, snapshot })
      router.push('/design')
    },
    [artwork, colorway.hex, router]
  )

  return (
    <div data-scroll-snap className="relative selection:bg-brand selection:text-white">
      {/* Ambient dotted grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:36px_36px] opacity-35 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_40%,#000_65%,transparent_100%)]" />

      {/* Copy of the studio page's frame, which the tee flies into on launch. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none fixed inset-0 z-0 flex flex-col bg-background opacity-0 transition-opacity duration-500 ease-out-strong',
          launching && 'opacity-100'
        )}
      >
        <PageContainer>
          <div className={STUDIO_FRAME_CLASS}>
            <div ref={studioFrameRef} className="size-full" />
          </div>
        </PageContainer>
      </div>

      {/* The 3D tee floats behind every section. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <LandingScene
          section={section}
          color={colorway.hex}
          decalUrl={colorway.decal}
          artworkUrl={artwork ?? undefined}
          isLaunching={launching}
          tipsPortal={tipsRef}
          studioFrame={studioFrameRef}
          onLaunched={enterStudio}
        />
      </div>

      {/* The tip pinned to the tee renders here, above the page text. */}
      <div ref={tipsRef} className="pointer-events-none fixed inset-0 z-20" />

      {launching && (
        <p role="status" className="sr-only">
          Opening the design studio
        </p>
      )}

      <ScrollHint visible={section === 'hero' && !launching} onClick={() => scrollToSection('collab')} />

      {/* The page text clears away on launch, leaving the tee and the studio frame. */}
      <div className={cn('transition-opacity duration-300 ease-out-strong', launching && 'pointer-events-none opacity-0')}>
        {/* Each section is a snap stop; the one in view sets the tee's pose and tips. */}
        <div className="relative z-10">
          <HeroSection onDesign={() => scrollToSection('design')} onMeetArtists={() => scrollToSection('collab')} />
          <CollabSection />
          <DesignSection
            colorway={colorway}
            onColorwayChange={setColorway}
            onArtworkChange={setArtwork}
            onOpenStudio={openStudio}
          />
        </div>
      </div>
    </div>
  )
}
