'use client'

import { useRef } from 'react'
import { FileDown, FileUp, Save, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { getGarment } from '../constants'
import { exportDesignFile, readDesignFile } from '../files'
import { useDrafts, useStudio } from '../store'
import { IconButton, PanelShell, Section } from './controls'

const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function DraftsPanel({ onSave }: { onSave: () => void }) {
  const drafts = useDrafts((state) => state.drafts)
  const removeDraft = useDrafts((state) => state.remove)
  const doc = useStudio((state) => state.doc)
  const load = useStudio((state) => state.load)
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <PanelShell title="Drafts" description="Saved in this browser. Export a file to move a design elsewhere.">
      <Button className="w-full" onClick={onSave}>
        <Save />
        Save “{doc.name}”
      </Button>

      <Section title="Saved" aside={drafts.length || undefined}>
        {drafts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No drafts yet. Saving keeps a snapshot you can come back to.</p>
        ) : (
          <ul className="space-y-1.5">
            {drafts.map((draft) => (
              <li key={draft.id} className="group flex items-center gap-2.5 rounded-lg border border-border p-1.5 pr-1">
                <button
                  type="button"
                  onClick={() => {
                    load(draft.doc)
                    toast.success(`Opened “${draft.doc.name}”`)
                  }}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
                >
                  <span className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {draft.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element -- local data URL
                      <img src={draft.thumbnail} alt="" className="size-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-foreground">{draft.doc.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {getGarment(draft.doc.garmentId).name} · {draft.doc.layers.length} layer{draft.doc.layers.length === 1 ? '' : 's'}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{timeFormat.format(draft.savedAt)}</span>
                  </span>
                </button>
                <IconButton
                  icon={Trash2}
                  label={`Delete ${draft.doc.name}`}
                  onClick={() => removeDraft(draft.id)}
                  className="[@media(hover:hover)]:opacity-0 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="File">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => exportDesignFile(doc)}>
            <FileDown />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            <FileUp />
            Import
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            try {
              load(await readDesignFile(file))
              toast.success(`Imported “${file.name}”`)
            } catch (error) {
              toast.danger(error instanceof SyntaxError ? "That file isn't valid JSON" : (error as Error).message)
            }
          }}
        />
      </Section>
    </PanelShell>
  )
}
