'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface ConfirmButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Question shown in place of the button, e.g. "Clear your cart?" */
  question: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => Promise<void> | void
}

/** A button that asks for inline confirmation before running a destructive action. */
export function ConfirmButton({
  question,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  onConfirm,
  size = 'sm',
  children,
  ...buttonProps
}: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
      setAsking(false)
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {asking ? (
        <motion.div
          key="asking"
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 6 }}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-xs text-muted-foreground">{question}</span>
          <Button variant="outline" size={size} onClick={() => setAsking(false)} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" size={size} onClick={confirm} disabled={busy}>
            {busy && <Spinner />}
            {confirmLabel}
          </Button>
        </motion.div>
      ) : (
        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Button size={size} onClick={() => setAsking(true)} {...buttonProps}>
            {children}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
