'use client'

import Image from 'next/image'
import Link from 'next/link'
import { COLORWAYS } from './content'

/**
 * Shop-style rail of the first artist drops, running along the bottom of the artists section.
 * There are no live drops yet, so each tile is an open slot, one per colorway, linking to the
 * artist sign-up. The six tiles sit still on the page's column (nothing loops on its own).
 */
export function DropSlots() {
  const tiles = COLORWAYS.map((colorway, i) => (
    <Link
      key={colorway.name}
      href="/collab"
      aria-label={`Drop ${String(i + 1).padStart(2, '0')}, ${colorway.name}: open slot, sell with us`}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-background/80 p-1.5 pr-4 backdrop-blur-md transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/40"
    >
      <span className="relative flex size-11 items-center justify-center rounded-xl" style={{ backgroundColor: colorway.hex }}>
        <Image src={colorway.decal} alt="" width={22} height={22} className="opacity-90" />
      </span>
      <span className="font-mono text-xs lowercase leading-tight">
        <span className="block text-foreground">drop {String(i + 1).padStart(2, '0')}</span>
        <span className="block text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
          {colorway.name}
        </span>
      </span>
    </Link>
  ))

  return (
    <div className="absolute inset-x-0 bottom-6 px-6 max-lg:hidden">
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-3 xl:grid-cols-6">{tiles}</div>
    </div>
  )
}
