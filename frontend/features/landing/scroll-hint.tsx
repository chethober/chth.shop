'use client'

import { AnimatePresence, motion } from 'framer-motion'

/**
 * "Scroll" cue pinned to the bottom of the screen until the visitor starts scrolling.
 * Desktop only: on phones the hero text fills the bottom of the screen and swiping is a given.
 */
export function ScrollHint({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={onClick}
          aria-label="Scroll down"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="fixed bottom-6 left-1/2 max-lg:hidden z-30 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 pb-[env(safe-area-inset-bottom,0px)] text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="flex h-9 w-6 items-start justify-center rounded-full border-2 border-current p-1.5">
            <motion.span
              animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              className="size-1.5 rounded-full bg-brand"
            />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest">Scroll</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
