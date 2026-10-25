'use client'

import { useEffect } from 'react'
import { sceneBridge, surfacePoint } from './scene-bridge'
import { useStudio } from './store'

const NUDGE = 0.005
const NUDGE_LARGE = 0.02
const ROTATE = Math.PI / 36
const ROTATE_LARGE = Math.PI / 12

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** Editor shortcuts. They act instantly, with no animation, since they're pressed over and over. */
export function useStudioShortcuts({ onSave }: { onSave: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return
      const studio = useStudio.getState()
      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()
      const layer = studio.doc.layers.find((l) => l.id === studio.selectedId)

      if (mod && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) studio.redo()
        else studio.undo()
        return
      }
      if (mod && key === 'y') {
        event.preventDefault()
        studio.redo()
        return
      }
      if (mod && key === 's') {
        event.preventDefault()
        onSave()
        return
      }
      if (mod) {
        if (key === 'd' && layer) {
          event.preventDefault()
          studio.duplicateLayer(layer.id)
        }
        return
      }

      if (key === 'escape') return studio.select(null)
      if (key === 'f') return sceneBridge.setView?.('front')
      if (key === 'b') return sceneBridge.setView?.('back')
      if (!layer) return

      if (key === 'delete' || key === 'backspace') {
        event.preventDefault()
        studio.removeLayer(layer.id)
        return
      }
      if (layer.locked) return

      const step = event.shiftKey ? NUDGE_LARGE : NUDGE
      // Arrows move the print as seen from its own side.
      const mirror = layer.side === 'back' ? -1 : 1
      const moves: Record<string, [number, number]> = {
        arrowleft: [-step * mirror, 0],
        arrowright: [step * mirror, 0],
        arrowup: [0, step],
        arrowdown: [0, -step],
      }
      if (moves[key]) {
        event.preventDefault()
        const [dx, dy] = moves[key]
        const [x, y, z] = layer.position
        studio.updateLayer(layer.id, { position: surfacePoint(x + dx, y + dy, layer.side, z) }, `nudge:${layer.id}`)
        return
      }
      // By code, since Shift turns the brackets into braces.
      const turn = event.code === 'BracketLeft' ? -1 : event.code === 'BracketRight' ? 1 : 0
      if (turn) {
        const angle = (event.shiftKey ? ROTATE_LARGE : ROTATE) * turn
        // Wrap into (-π, π] to stay within the rotation slider's range.
        const rotation = Math.atan2(Math.sin(layer.rotation + angle), Math.cos(layer.rotation + angle))
        studio.updateLayer(layer.id, { rotation }, `rotate:${layer.id}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSave])
}
