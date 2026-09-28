'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useScroll, useSpring } from 'framer-motion'
import { useIsDarkTheme } from '@/hooks/use-is-dark-theme'
import { COLORWAYS, DEFAULT_COLORWAY, type Colorway, type SectionId } from './content'
import { LaunchZone } from './launch-zone'
import { ScrollHint } from './scroll-hint'
import { CollabSection } from './sections/collab-section'
import { DesignSection } from './sections/design-section'
import { HeroSection } from './sections/hero-section'
import { StudioLaunchOverlay } from './studio-launch-overlay'

// WebGL can't render on the server.
const LandingScene = dynamic(() => import('./landing-scene'), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center lg:justify-end lg:pr-[22%]">
      <div className="size-12 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
    </div>
  ),
})

const NAV_OFFSET = 70
/** Launch once the launch zone is scrolled through to the very bottom of the page. */
const LAUNCH_AT = 0.98

function scrollToSection(id: SectionId) {
  const el = document.getElementById(id)
  if (!el) return
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET, behavior: 'smooth' })
}

/**
 * Three-part landing page (the tee → for artists → design studio). One 3D tee floats behind
 * all sections; scroll progress moves it between poses and reveals tips pinned to it.
 * Scrolling past the last section, to the bottom of the page, opens the design studio.
 */
export function HomeView() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const tipsRef = useRef<HTMLDivElement>(null)
  const launchZoneRef = useRef<HTMLDivElement>(null)
  const launched = useRef(false)

  // Until the visitor picks a swatch, the tee contrasts with the current theme.
  const isDark = useIsDarkTheme()
  const [chosenColorway, setColorway] = useState<Colorway | null>(null)
  const colorway =
    chosenColorway ?? COLORWAYS.find((c) => c.name === DEFAULT_COLORWAY[isDark ? 'dark' : 'light']) ?? COLORWAYS[0]
  const [progress, setProgress] = useState(0)
  const [launchProgress, setLaunchProgress] = useState<number | null>(null)
  const [launchZoneProgress, setLaunchZoneProgress] = useState(0)

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 70, damping: 24, restDelta: 0.001 })

  useEffect(() => smoothProgress.on('change', setProgress), [smoothProgress])

  // Tracked separately so the tee's poses keep mapping to the three sections only.
  const { scrollYProgress: launchZoneScroll } = useScroll({ target: launchZoneRef, offset: ['start end', 'end end'] })

  const openStudio = useCallback(() => {
    if (launched.current) return
    launched.current = true

    let value = 0
    setLaunchProgress(0)
    const interval = setInterval(() => {
      value = Math.min(100, value + 15)
      setLaunchProgress(value)
      if (value === 100) {
        clearInterval(interval)
        setTimeout(() => router.push('/design'), 350)
      }
    }, 70)
  }, [router])

  // Only a visitor scrolling down through the zone launches the studio. A page that opens
  // already at the bottom (e.g. scroll restored after pressing Back) must be scrolled up first.
  useEffect(() => {
    let armed = false
    return launchZoneScroll.on('change', (value) => {
      setLaunchZoneProgress(value)
      if (value < 0.9) armed = true
      else if (armed && value >= LAUNCH_AT) openStudio()
    })
  }, [launchZoneScroll, openStudio])

  return (
    <div className="relative selection:bg-brand selection:text-white">
      {/* Ambient dotted grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:36px_36px] opacity-35 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_40%,#000_65%,transparent_100%)]" />

      {/* The 3D tee floats behind every section. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <LandingScene
          progress={progress}
          color={colorway.hex}
          decalUrl={colorway.decal}
          isLaunching={launchProgress !== null}
          tipsPortal={tipsRef}
        />
      </div>

      {/* Tips pinned to the tee render here, above the page text. */}
      <div ref={tipsRef} className="pointer-events-none fixed inset-0 z-20" />

      {launchProgress !== null && <StudioLaunchOverlay progress={launchProgress} />}

      <ScrollHint visible={progress < 0.03 && launchProgress === null} onClick={() => scrollToSection('collab')} />

      {/* Scroll progress across these three sections drives the tee's poses and tips. */}
      <div ref={containerRef} className="relative z-10">
        <HeroSection onDesign={() => scrollToSection('design')} onMeetArtists={() => scrollToSection('collab')} />
        <CollabSection />
        <DesignSection colorway={colorway} onColorwayChange={setColorway} onOpenStudio={openStudio} />
      </div>

      <LaunchZone ref={launchZoneRef} progress={launchZoneProgress} />
    </div>
  )
}
