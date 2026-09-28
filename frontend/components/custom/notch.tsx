'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type NotchOption = {
  /** Stable identifier passed back in callbacks. */
  id: string
  /** What renders for this option. Can be text or any node. */
  label: React.ReactNode
  /** Optional leading node (icon, swatch, etc.) shown before the label. */
  icon?: React.ReactNode
  /** Optional subtitle or description */
  description?: React.ReactNode
}

export type NotchItem = {
  /** Stable identifier for the group. */
  id: string
  /** Trigger label shown in the bar. */
  label: React.ReactNode
  /** Optional leading icon for the trigger. */
  icon?: React.ReactNode
  /** The choices revealed when the group is opened. */
  options: NotchOption[]
  /** Uncontrolled initial selected option id. */
  defaultValue?: string
  /** Controlled selected option id. */
  value?: string
  /** Show the selected value next to the trigger label. Overrides `showSelectedValue`. */
  showValue?: boolean
  /** Fires with the selected option whenever it changes. */
  onChange?: (optionId: string, option: NotchOption) => void
}

export interface NotchProps {
  /** The groups shown inside the notch. Pass one or many. */
  items: NotchItem[]
  /** Pin the notch to the top or bottom. */
  position?: 'top' | 'bottom'
  /** Horizontal alignment of the floating notch. */
  align?: 'start' | 'center' | 'end'
  /** 'fixed' pins to viewport; 'docked' pins absolutely to parent container */
  variant?: 'fixed' | 'docked'
  /** Fired for any group change, in addition to the per-item callback. */
  onItemChange?: (
    itemId: string,
    optionId: string,
    option: NotchOption
  ) => void
  /** Close the panel after selecting an option. */
  closeOnSelect?: boolean
  /** Show each group's selected value next to its trigger label. */
  showSelectedValue?: boolean
  /** Render dotted dividers between groups. */
  showDividers?: boolean
  /** Highlight color for the selected option. Any CSS color or variable. */
  accentColor?: string
  /** Distance from the pinned edge, in pixels. */
  offset?: number
  /** Play the entrance animation on mount. */
  reveal?: boolean
  /** Classes applied to the floating shell. */
  className?: string
  /** Classes applied to every trigger. */
  itemClassName?: string
  /** Classes applied to the options panel. */
  panelClassName?: string
}

const SHELL_SPRING = { type: 'spring' as const, stiffness: 380, damping: 34 }

const LIST_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
}

const OPTION_VARIANTS = {
  hidden: { opacity: 0, y: -8, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 420, damping: 30 },
  },
}

function NotchDivider() {
  return (
    <span
      aria-hidden
      className="mx-0.5 h-4 w-px shrink-0 self-center opacity-40"
      style={{
        backgroundImage:
          'repeating-linear-gradient(180deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 4px)',
        backgroundSize: '1px 4px',
        backgroundRepeat: 'repeat-y',
      }}
    />
  )
}

export const Notch = ({
  items,
  position = 'bottom',
  align = 'center',
  variant = 'docked',
  onItemChange,
  closeOnSelect = true,
  showSelectedValue = true,
  showDividers = true,
  accentColor = '#EFBD48',
  offset = 16,
  reveal = true,
  className,
  itemClassName,
  panelClassName,
}: NotchProps) => {
  const shellRef = useRef<HTMLDivElement>(null)
  const shellLayoutId = useId()
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  const [internalSelected, setInternalSelected] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const item of items) {
      if (item.value === undefined) {
        map[item.id] = item.defaultValue ?? item.options[0]?.id ?? ''
      }
    }
    return map
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenItemId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!openItemId) return
    function onPointerDown(e: PointerEvent) {
      if (!shellRef.current?.contains(e.target as Node)) {
        setOpenItemId(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [openItemId])

  const getSelectedId = (item: NotchItem) =>
    item.value ?? internalSelected[item.id] ?? item.options[0]?.id

  const getSelectedOption = (item: NotchItem) =>
    item.options.find((o) => o.id === getSelectedId(item))

  const handleSelect = (item: NotchItem, option: NotchOption) => {
    if (item.value === undefined) {
      setInternalSelected((prev) => ({ ...prev, [item.id]: option.id }))
    }
    item.onChange?.(option.id, option)
    onItemChange?.(item.id, option.id, option)
    if (closeOnSelect) setOpenItemId(null)
  }

  const alignClass =
    align === 'start'
      ? 'justify-start'
      : align === 'end'
        ? 'justify-end'
        : 'justify-center'

  const edgeOffset = (offset + 16) * (position === 'top' ? -1 : 1)
  const openItem = items.find((i) => i.id === openItemId) ?? null

  const optionsPanel = openItem ? (
    <motion.div
      key={openItem.id}
      role="listbox"
      aria-label={
        typeof openItem.label === 'string' ? openItem.label : openItem.id
      }
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      className={cn('w-fit min-w-[200px] max-w-[calc(100vw-2rem)]', panelClassName)}
    >
      <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
        <span className="flex items-center gap-1.5 font-semibold text-neutral-200">
          {openItem.icon}
          <span>{openItem.label}</span>
        </span>
        <button
          type="button"
          onClick={() => setOpenItemId(null)}
          className="hover:text-white transition-colors cursor-pointer px-1 py-0.5 rounded text-[10px]"
        >
          esc
        </button>
      </div>

      <motion.div
        className="flex flex-col gap-1 p-1.5 max-h-72 overflow-y-auto"
        variants={LIST_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        {openItem.options.map((option) => {
          const active = option.id === getSelectedId(openItem)
          return (
            <motion.button
              key={option.id}
              role="option"
              aria-selected={active}
              type="button"
              variants={OPTION_VARIANTS}
              onClick={() => handleSelect(openItem, option)}
              className={cn(
                'group flex w-full items-center justify-between gap-4 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                active
                  ? 'text-white font-semibold'
                  : 'text-neutral-300 hover:bg-white/8 hover:text-white'
              )}
              style={
                active
                  ? {
                      background: `color-mix(in srgb, ${accentColor} 20%, rgba(255,255,255,0.06))`,
                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accentColor} 60%, transparent)`,
                    }
                  : undefined
              }
            >
              <span className="flex items-center gap-2.5">
                {option.icon ? (
                  <span className="flex shrink-0 items-center justify-center">
                    {option.icon}
                  </span>
                ) : null}
                <span className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-[10px] text-neutral-400 font-normal">
                      {option.description}
                    </span>
                  )}
                </span>
              </span>
              {active ? (
                <span
                  className="size-1.5 shrink-0 rounded-full shadow-sm"
                  style={{ background: accentColor }}
                />
              ) : null}
            </motion.button>
          )
        })}
      </motion.div>
    </motion.div>
  ) : (
    <motion.div
      key="__notch-triggers"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      className="flex w-fit max-w-full items-center gap-1 p-1 overflow-x-auto"
    >
      {items.map((item, index) => {
        const selected = getSelectedOption(item)
        const isLast = index === items.length - 1

        return (
          <React.Fragment key={item.id}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={openItemId === item.id}
              onClick={() => setOpenItemId(item.id)}
              className={cn(
                'group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-neutral-300 transition-all duration-150 hover:bg-white/8 hover:text-white cursor-pointer active:scale-95',
                itemClassName
              )}
            >
              {item.icon ? (
                <span className="flex shrink-0 items-center justify-center text-neutral-400 group-hover:text-neutral-200 transition-colors">
                  {item.icon}
                </span>
              ) : null}
              <span className="text-neutral-200 font-medium">{item.label}</span>
              {(item.showValue ?? showSelectedValue) && selected ? (
                <span className="flex items-center gap-1.5 pl-1 text-neutral-400 text-[11px] font-mono">
                  {selected.icon ? (
                    <span className="inline-flex shrink-0 items-center justify-center">
                      {selected.icon}
                    </span>
                  ) : null}
                  <span className="truncate max-w-[80px]">{selected.label}</span>
                </span>
              ) : null}
            </button>
            {showDividers && !isLast ? <NotchDivider /> : null}
          </React.Fragment>
        )
      })}
    </motion.div>
  )

  const posClass =
    variant === 'fixed'
      ? cn(
          'fixed inset-x-0 z-50 pointer-events-none flex translate-z-0 px-4',
          position === 'top' ? 'top-0' : 'bottom-0',
          alignClass
        )
      : cn(
          'absolute inset-x-0 z-30 pointer-events-none flex translate-z-0 px-4',
          position === 'top' ? 'top-0' : 'bottom-0',
          alignClass
        )

  return (
    <div
      className={posClass}
      style={
        position === 'top'
          ? { paddingTop: `${offset}px` }
          : { paddingBottom: `${offset}px` }
      }
    >
      <motion.div
        ref={shellRef}
        layoutId={shellLayoutId}
        layout
        initial={
          reveal ? { opacity: 0, y: edgeOffset, filter: 'blur(6px)' } : false
        }
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={SHELL_SPRING}
        className={cn(
          'pointer-events-auto flex w-fit flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-950/95 text-neutral-100 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)] ring-1 ring-white/5 backdrop-blur-2xl',
          className
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {optionsPanel}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
export default Notch
