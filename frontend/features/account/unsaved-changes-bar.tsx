'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Spinner } from '@/components/ui/spinner'

interface UnsavedChangesBarProps {
  visible: boolean
  saving: boolean
  canSave: boolean
  onSave: () => void
  onDiscard: () => void
  /** Shown when the form is on another tab, to jump back to it. */
  onReview?: () => void
}

/** Floating bar that appears while the storefront form has unsaved edits. */
export function UnsavedChangesBar({ visible, saving, canSave, onSave, onDiscard, onReview }: UnsavedChangesBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center pb-[env(safe-area-inset-bottom,0px)]"
        >
          <div
            role="status"
            className="pointer-events-auto flex max-w-full items-center gap-3 rounded-2xl bg-foreground py-2 pl-4 pr-2 text-background shadow-2xl"
          >
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-brand" />
            <span className="truncate text-xs font-semibold">Unsaved store changes</span>
            {onReview && (
              <button
                type="button"
                onClick={onReview}
                className="cursor-pointer whitespace-nowrap text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
              >
                Review
              </button>
            )}
            <button
              type="button"
              onClick={onDiscard}
              disabled={saving}
              className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-background/10 disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !canSave}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-background/90 disabled:opacity-50"
            >
              {saving && <Spinner className="size-3.5" />}
              Save
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
