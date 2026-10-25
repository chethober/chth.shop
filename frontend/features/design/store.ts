import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { ProductType } from '@/types'
import {
  EMPTY_DOC,
  getGarment,
  type BackdropId,
  type DesignDoc,
  type DesignLayer,
  type Placement,
} from './constants'
import { surfacePoint } from './scene-bridge'

let storageFull = false

/** localStorage that tolerates being full or blocked; uploaded artwork can make a design several MB. */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
      storageFull = false
    } catch {
      storageFull = true
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  },
}

let autosaveTimer: ReturnType<typeof setTimeout> | undefined

/** Autosave waits for a pause in editing, so a drag doesn't serialise the artwork on every frame. */
const autosaveStorage: StateStorage = {
  ...safeStorage,
  setItem: (name, value) => {
    clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => safeStorage.setItem(name, value), 400)
  },
}

/** Whether the last save failed, e.g. because the artwork outgrew browser storage. */
export const isStorageFull = () => storageFull

export type Tool = 'product' | 'color' | 'uploads' | 'text' | 'ai' | 'layers' | 'drafts'

export interface Asset {
  id: string
  name: string
  url: string
}

const HISTORY_LIMIT = 100
/** Edits sharing a key this close together (one slider drag, one surface drag) undo as a single step. */
const COALESCE_MS = 600

type NewLayer = Pick<DesignLayer, 'type' | 'name' | 'content'> & Partial<DesignLayer>

interface StudioState {
  doc: DesignDoc
  past: DesignDoc[]
  future: DesignDoc[]
  lastEdit: { key: string; at: number } | null

  selectedId: string | null
  tool: Tool
  autoRotate: boolean
  backdrop: BackdropId
  assets: Asset[]

  /** Applies a change to the design. Changes that share `key` in quick succession merge into one undo step. */
  edit: (recipe: (doc: DesignDoc) => DesignDoc, key?: string) => void
  undo: () => void
  redo: () => void
  /** Replaces the whole design (draft, import, reset), as one undoable step. */
  load: (doc: DesignDoc) => void

  setGarment: (id: ProductType) => void
  setColor: (color: string, key?: string) => void
  setFabric: (id: string) => void
  rename: (name: string) => void

  addLayer: (layer: NewLayer, placement?: Placement) => void
  updateLayer: (id: string, changes: Partial<DesignLayer>, key?: string) => void
  placeLayer: (id: string, placement: Placement) => void
  removeLayer: (id: string) => void
  duplicateLayer: (id: string) => void
  /** Moves a layer up (+1, printed on top) or down (-1) the stack. */
  reorderLayer: (id: string, direction: 1 | -1) => void

  select: (id: string | null) => void
  setTool: (tool: Tool) => void
  setAutoRotate: (on: boolean) => void
  setBackdrop: (backdrop: BackdropId) => void
  addAsset: (asset: Omit<Asset, 'id'>) => Asset
  removeAsset: (id: string) => void
}

function placementPosition(doc: DesignDoc, placement: Placement) {
  const garment = getGarment(doc.garmentId)
  return surfacePoint(placement.x, placement.y, placement.side, garment.chestPosition[2])
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => {
      const updateLayers = (recipe: (layers: DesignLayer[]) => DesignLayer[], key?: string) =>
        get().edit((doc) => ({ ...doc, layers: recipe(doc.layers) }), key)

      return {
        doc: EMPTY_DOC,
        past: [],
        future: [],
        lastEdit: null,

        selectedId: null,
        tool: 'product',
        autoRotate: false,
        backdrop: 'light',
        assets: [],

        edit: (recipe, key) =>
          set((state) => {
            const now = performance.now()
            const merge = key && state.lastEdit?.key === key && now - state.lastEdit.at < COALESCE_MS
            return {
              doc: recipe(state.doc),
              past: merge ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT),
              future: [],
              lastEdit: key ? { key, at: now } : null,
            }
          }),

        undo: () =>
          set((state) => {
            const previous = state.past[state.past.length - 1]
            if (!previous) return state
            return {
              doc: previous,
              past: state.past.slice(0, -1),
              future: [state.doc, ...state.future],
              lastEdit: null,
              selectedId: previous.layers.some((l) => l.id === state.selectedId) ? state.selectedId : null,
            }
          }),

        redo: () =>
          set((state) => {
            const [next, ...future] = state.future
            if (!next) return state
            return {
              doc: next,
              past: [...state.past, state.doc],
              future,
              lastEdit: null,
              selectedId: next.layers.some((l) => l.id === state.selectedId) ? state.selectedId : null,
            }
          }),

        load: (doc) => {
          get().edit(() => doc)
          set({ selectedId: null })
        },

        setGarment: (garmentId) => get().edit((doc) => ({ ...doc, garmentId })),
        setColor: (color, key) => get().edit((doc) => ({ ...doc, color }), key),
        setFabric: (fabric) => get().edit((doc) => ({ ...doc, fabric })),
        rename: (name) => get().edit((doc) => ({ ...doc, name }), 'rename'),

        addLayer: (layer, placement) => {
          const { doc } = get()
          const spot = placement ?? getGarment(doc.garmentId).placements[0]
          const id = crypto.randomUUID()
          const created: DesignLayer = {
            position: placementPosition(doc, spot),
            side: spot.side,
            rotation: 0,
            size: spot.size,
            opacity: 1,
            flipX: false,
            visible: true,
            locked: false,
            ...layer,
            id,
          }
          updateLayers((layers) => [...layers, created])
          set({ selectedId: id })
        },

        updateLayer: (id, changes, key) =>
          updateLayers((layers) => layers.map((layer) => (layer.id === id ? { ...layer, ...changes } : layer)), key),

        placeLayer: (id, placement) => {
          const position = placementPosition(get().doc, placement)
          get().updateLayer(id, { position, side: placement.side, size: placement.size, rotation: 0 })
        },

        removeLayer: (id) => {
          updateLayers((layers) => layers.filter((layer) => layer.id !== id))
          if (get().selectedId === id) set({ selectedId: null })
        },

        duplicateLayer: (id) => {
          const source = get().doc.layers.find((layer) => layer.id === id)
          if (!source) return
          const copy: DesignLayer = {
            ...source,
            id: crypto.randomUUID(),
            name: `${source.name} copy`,
            locked: false,
            // Offset the copy so it doesn't hide exactly behind the original.
            position: [source.position[0] + 0.03, source.position[1] - 0.03, source.position[2]],
          }
          updateLayers((layers) => {
            const index = layers.findIndex((layer) => layer.id === id)
            return [...layers.slice(0, index + 1), copy, ...layers.slice(index + 1)]
          })
          set({ selectedId: copy.id })
        },

        reorderLayer: (id, direction) =>
          updateLayers((layers) => {
            const index = layers.findIndex((layer) => layer.id === id)
            const target = index + direction
            if (index < 0 || target < 0 || target >= layers.length) return layers
            const next = [...layers]
            ;[next[index], next[target]] = [next[target], next[index]]
            return next
          }),

        select: (selectedId) => set({ selectedId }),
        setTool: (tool) => set({ tool }),
        setAutoRotate: (autoRotate) => set({ autoRotate }),
        setBackdrop: (backdrop) => set({ backdrop }),
        addAsset: (asset) => {
          const created = { ...asset, id: crypto.randomUUID() }
          set((state) => ({ assets: [created, ...state.assets] }))
          return created
        },
        removeAsset: (id) => set((state) => ({ assets: state.assets.filter((asset) => asset.id !== id) })),
      }
    },
    {
      name: 'chth-studio',
      storage: createJSONStorage(() => autosaveStorage),
      partialize: (state) => ({ doc: state.doc, backdrop: state.backdrop }),
      // Rehydrated on mount, so the server render and the first client render agree.
      skipHydration: true,
    }
  )
)

export function useSelectedLayer() {
  return useStudio((state) => state.doc.layers.find((layer) => layer.id === state.selectedId) ?? null)
}

export interface Draft {
  id: string
  savedAt: number
  thumbnail: string | null
  doc: DesignDoc
}

interface DraftsState {
  drafts: Draft[]
  /** Saves the design, overwriting an earlier draft of the same name. Returns false if storage is full. */
  save: (doc: DesignDoc, thumbnail: string | null) => boolean
  remove: (id: string) => void
}

export const useDrafts = create<DraftsState>()(
  persist(
    (set, get) => ({
      drafts: [],
      save: (doc, thumbnail) => {
        const previous = get().drafts
        const existing = previous.find((draft) => draft.doc.name === doc.name)
        const draft: Draft = { id: existing?.id ?? crypto.randomUUID(), savedAt: Date.now(), thumbnail, doc }
        set({ drafts: [draft, ...previous.filter((d) => d.id !== draft.id)] })
        if (!storageFull) return true
        set({ drafts: previous })
        return false
      },
      remove: (id) => set((state) => ({ drafts: state.drafts.filter((draft) => draft.id !== id) })),
    }),
    { name: 'chth-studio-drafts', storage: createJSONStorage(() => safeStorage), skipHydration: true }
  )
)
