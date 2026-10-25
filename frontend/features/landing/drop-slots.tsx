'use client'

import Image from 'next/image'
import Link from 'next/link'
import { COLORWAYS } from './content'

/**
 * Shop-style rail of the first artist drops, running along the bottom of the artists section.
 * There are no live drops yet, so each tile is an open slot, one per colorway, linking to the
 * artist sign-up. The rail scrolls on its own and pauses under the pointer; with reduced motion
 * it holds still and can be scrolled by hand.
 */
export function DropSlots() {
  const tiles = COLORWAYS.map((colorway, i) => (
    <Link
      key={colorway.name}
      href="/collab"
      className="group flex shrink-0 items-center gap-3 rounded-lg border border-border/60 bg-background/70 p-1.5 pr-4 backdrop-blur-md transition-colors duration-200 hover:border-foreground/40"
    >
      <span className="relative flex size-11 items-center justify-center rounded-md" style={{ backgroundColor: colorway.hex }}>
        <Image src={colorway.decal} alt="" width={22} height={22} className="opacity-90" />
      </span>
      <span className="font-mono text-xs lowercase leading-tight">
        <span className="block text-foreground">drop {String(i + 1).padStart(2, '0')}</span>
        <span className="block text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
          {colorway.name} · open slot
        </span>
      </span>
    </Link>
  ))

  return (
    <div className="absolute inset-x-0 bottom-6 overflow-x-auto [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] [scrollbar-width:none] max-lg:hidden">
      <div className="flex w-max gap-3 motion-safe:animate-marquee motion-safe:hover:[animation-play-state:paused]">
        <div className="flex gap-3">{tiles}</div>
        {/* Second copy for the loop; hidden from assistive tech and the tab order. */}
        <div aria-hidden inert className="flex gap-3 motion-reduce:hidden">
          {tiles}
        </div>
      </div>
    </div>
  )
}
