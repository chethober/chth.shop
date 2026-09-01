'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Pipette, Check, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FancyColorPickerProps {
  color: string
  onChange: (hex: string) => void
  presets?: { name: string; value: string }[]
  className?: string
}

// Convert Hex to HSV
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let cleanHex = hex.replace('#', '')
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('')
  }
  if (cleanHex.length !== 6) {
    return { h: 0, s: 100, v: 100 }
  }

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6
    } else if (max === g) {
      h = (b - r) / diff + 2
    } else {
      h = (r - g) / diff + 4
    }
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }

  const s = max === 0 ? 0 : Math.round((diff / max) * 100)
  const v = Math.round(max * 100)

  return { h, s, v }
}

// Convert HSV to Hex
function hsvToHex(h: number, s: number, v: number): string {
  const sat = s / 100
  const val = v / 100

  const c = val * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = val - c

  let r = 0, g = 0, b = 0
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16).padStart(2, '0')
    return hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export function FancyColorPicker({
  color,
  onChange,
  presets = [],
  className
}: FancyColorPickerProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(color || '#EFBD48'))
  const [inputValue, setInputValue] = useState(color || '#EFBD48')
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false)

  const satValRef = useRef<HTMLDivElement>(null)
  const isDraggingSatVal = useRef(false)
  const hsvRef = useRef(hsv)
  hsvRef.current = hsv

  useEffect(() => {
    setIsEyeDropperSupported(typeof window !== 'undefined' && 'EyeDropper' in window)
  }, [])

  useEffect(() => {
    if (color) {
      const currentHexCalculated = hsvToHex(hsvRef.current.h, hsvRef.current.s, hsvRef.current.v)
      if (color.toUpperCase() !== currentHexCalculated.toUpperCase()) {
        const newHsv = hexToHsv(color)
        setHsv(newHsv)
        setInputValue(color)
      }
    }
  }, [color])

  // Handle Saturation & Brightness 2D Area
  const updateSatValFromEvent = useCallback((clientX: number, clientY: number) => {
    if (!satValRef.current) return
    const rect = satValRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top))

    const newS = Math.round((x / rect.width) * 100)
    const newV = Math.round((1 - y / rect.height) * 100)

    const updated = { ...hsvRef.current, s: newS, v: newV }
    const newHex = hsvToHex(updated.h, updated.s, updated.v)
    
    setHsv(updated)
    setInputValue(newHex)
    onChange(newHex)
  }, [onChange])

  // Pointer down on Saturation/Value area
  const handleSatValPointerDown = (e: React.PointerEvent) => {
    isDraggingSatVal.current = true
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    updateSatValFromEvent(e.clientX, e.clientY)
  }

  const handleSatValPointerMove = (e: React.PointerEvent) => {
    if (isDraggingSatVal.current) {
      updateSatValFromEvent(e.clientX, e.clientY)
    }
  }

  const handleSatValPointerUp = (e: React.PointerEvent) => {
    isDraggingSatVal.current = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    } catch {}
  }

  // Handle Hue Slider
  const handleHueChange = (newHue: number) => {
    const updated = { ...hsvRef.current, h: newHue }
    const newHex = hsvToHex(updated.h, updated.s, updated.v)
    setHsv(updated)
    setInputValue(newHex)
    onChange(newHex)
  }

  // Handle Manual Hex Input
  const handleHexInputChange = (val: string) => {
    setInputValue(val)
    if (/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
      const formatted = val.startsWith('#') ? val : `#${val}`
      const newHsv = hexToHsv(formatted)
      setHsv(newHsv)
      onChange(formatted.toUpperCase())
    }
  }

  // EyeDropper API
  const handleEyeDropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper()
        const result = await eyeDropper.open()
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase()
          setHsv(hexToHsv(hex))
          setInputValue(hex)
          onChange(hex)
        }
      } catch (e) {
        // User canceled eye dropper selection
      }
    }
  }

  const pureHueColor = `hsl(${hsv.h}, 100%, 50%)`
  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v)

  return (
    <div className={cn("space-y-3.5 select-none", className)}>
      {/* 2D Saturation / Value Gradient Canvas */}
      <div
        ref={satValRef}
        onPointerDown={handleSatValPointerDown}
        onPointerMove={handleSatValPointerMove}
        onPointerUp={handleSatValPointerUp}
        className="relative w-full h-32 rounded-2xl cursor-crosshair overflow-hidden shadow-inner border border-white/20 touch-none"
        style={{
          backgroundColor: pureHueColor,
          backgroundImage: `
            linear-gradient(to top, #000, transparent),
            linear-gradient(to right, #FFF, transparent)
          `
        }}
      >
        {/* Handle / Thumb indicator */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform active:scale-125"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: currentHex
          }}
        />
      </div>

      {/* Hue Slider Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
          <span>Hue Spectrum</span>
          <span className="font-mono">{hsv.h}°</span>
        </div>
        <div className="relative flex items-center h-4 rounded-full border border-white/20 px-1 overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
          }}
        >
          <input
            type="range"
            min="0"
            max="360"
            value={hsv.h}
            onChange={(e) => handleHueChange(Number(e.target.value))}
            className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
          />
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm pointer-events-none absolute -translate-x-1/2"
            style={{
              left: `calc(${(hsv.h / 360) * 100}%)`,
              backgroundColor: pureHueColor
            }}
          />
        </div>
      </div>

      {/* Hex input & Eyedropper & Swatch Preview */}
      <div className="flex items-center gap-2 pt-1">
        {/* Eyedropper Button */}
        {isEyeDropperSupported && (
          <button
            type="button"
            onClick={handleEyeDropper}
            title="Pick color from screen"
            className="w-8 h-8 rounded-full glass border border-white/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors shrink-0 shadow-sm"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Current Color Indicator */}
        <div
          className="w-8 h-8 rounded-full border border-white/30 shadow-md shrink-0 transition-transform hover:scale-105"
          style={{ backgroundColor: currentHex }}
          title={currentHex}
        />

        {/* Hex Text Field */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleHexInputChange(e.target.value)}
            placeholder="#FFFFFF"
            maxLength={7}
            className="w-full px-3 py-1.5 rounded-full text-xs font-mono uppercase glass border border-white/20 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
          />
        </div>
      </div>

      {/* Preset Swatches Palette */}
      {presets.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border/20">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Curated Swatches
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {presets.map((p) => {
              const isSelected = currentHex.toUpperCase() === p.value.toUpperCase()
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setHsv(hexToHsv(p.value))
                    setInputValue(p.value)
                    onChange(p.value)
                  }}
                  title={p.name}
                  className={cn(
                    "h-7 rounded-xl border border-white/30 transition-transform duration-200 hover:scale-105 shadow-sm flex items-center justify-center relative",
                    isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105"
                  )}
                  style={{ backgroundColor: p.value }}
                >
                  {isSelected && (
                    <Check
                      className={cn(
                        "w-3 h-3",
                        p.value.toUpperCase() === '#FFFFFF' ? "text-black" : "text-white"
                      )}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
