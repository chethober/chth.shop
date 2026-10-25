'use client'

import { Download, Eraser, FileJson, ImageDown, LayoutPanelLeft, Redo2, Save, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportDesignFile } from './files'
import { IconButton, Menu, MenuItem, useModKey } from './panels/controls'
import { useStudio } from './store'

interface ToolbarProps {
  onSave: () => void
  onClear: () => void
  onExportView: () => void
  onExportSheet: () => void
}

export function Toolbar({ onSave, onClear, onExportView, onExportSheet }: ToolbarProps) {
  const name = useStudio((state) => state.doc.name)
  const canUndo = useStudio((state) => state.past.length > 0)
  const canRedo = useStudio((state) => state.future.length > 0)
  const hasLayers = useStudio((state) => state.doc.layers.length > 0)
  const { rename, undo, redo } = useStudio.getState()
  const mod = useModKey()

  return (
    <>
      <span className="hidden items-center gap-2 pl-1.5 pr-1 sm:flex">
        <span className="size-1.5 rounded-full bg-brand" />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Studio</span>
      </span>
      <span className="hidden h-5 w-px bg-border sm:block" />
      <input
        value={name}
        onChange={(event) => rename(event.target.value)}
        onBlur={(event) => !event.target.value.trim() && rename('Untitled design')}
        aria-label="Design name"
        maxLength={60}
        className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm font-medium text-foreground outline-none hover:border-border focus-visible:border-input focus-visible:ring-2 focus-visible:ring-ring sm:max-w-72"
      />

      <div className="ml-auto flex items-center gap-0.5">
        <IconButton icon={Undo2} label={`Undo (${mod}Z)`} disabled={!canUndo} onClick={undo} />
        <IconButton icon={Redo2} label={`Redo (${mod}⇧Z)`} disabled={!canRedo} onClick={redo} />
        <IconButton icon={Eraser} label="Clear design" disabled={!hasLayers} onClick={onClear} className="max-sm:hidden" />
      </div>
      <span className="h-5 w-px bg-border" />
      <Button variant="ghost" size="sm" onClick={onSave} className="max-sm:px-2" aria-label="Save draft">
        <Save />
        <span className="max-sm:hidden">Save</span>
      </Button>
      <Menu
        trigger={({ open, toggle }) => (
          <Button size="sm" onClick={toggle} aria-expanded={open} aria-haspopup="menu" className="max-sm:px-2" aria-label="Export">
            <Download />
            <span className="max-sm:hidden">Export</span>
          </Button>
        )}
      >
        {(close) => (
          <>
            <MenuItem
              icon={ImageDown}
              label="Image of this view"
              hint="PNG at screen resolution"
              onSelect={() => {
                close()
                onExportView()
              }}
            />
            <MenuItem
              icon={LayoutPanelLeft}
              label="Tech sheet"
              hint="Front + back with the spec"
              onSelect={() => {
                close()
                onExportSheet()
              }}
            />
            <MenuItem
              icon={FileJson}
              label="Design file"
              hint="Re-open it later in the studio"
              onSelect={() => {
                close()
                exportDesignFile(useStudio.getState().doc)
              }}
            />
          </>
        )}
      </Menu>
    </>
  )
}
