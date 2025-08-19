'use client'

import { useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { motion } from 'framer-motion'
import { ColorOption } from '@/types'
import { cn, hexToRgb, getContrastColor } from '@/lib/utils'

interface ColorPickerProps {
  colors: ColorOption[]
  selectedColor: string
  onColorChange: (color: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
}

const ColorPicker = ({
  colors,
  selectedColor,
  onColorChange,
  className,
  size = 'md',
  showLabels = true
}: ColorPickerProps) => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const currentColor = colors.find(c => c.value === selectedColor) || colors[0]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Color Display */}
      {showLabels && (
        <div className="flex items-center space-x-3">
          <Palette className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium text-foreground">
              Color: {hoveredColor ?
                colors.find(c => c.value === hoveredColor)?.name || 'Unknown' :
                currentColor?.name || 'None'
              }
            </div>
            <div className="text-xs text-muted-foreground">
              {hoveredColor ?
                colors.find(c => c.value === hoveredColor)?.hex || '#000000' :
                currentColor?.hex || '#000000'
              }
            </div>
          </div>
        </div>
      )}

      {/* Color Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {colors.map((color, index) => {
          const isSelected = selectedColor === color.value
          const isHovered = hoveredColor === color.value

          return (
            <motion.button
              key={color.value}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.2,
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onColorChange(color.value)}
              onMouseEnter={() => setHoveredColor(color.value)}
              onMouseLeave={() => setHoveredColor(null)}
              className={cn(
                'relative rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                sizeClasses[size],
                isSelected
                  ? 'border-primary shadow-lg ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50',
                isHovered && !isSelected && 'border-primary/70 shadow-md'
              )}
              style={{ backgroundColor: color.hex }}
              title={`${color.name} (${color.hex})`}
              aria-label={`Select ${color.name} color`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Check
                    className={cn(iconSizes[size])}
                    style={{ color: getContrastColor(color.hex) }}
                  />
                </motion.div>
              )}

              {/* Hover indicator */}
              {isHovered && !isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    className="w-2 h-2 rounded-full border"
                    style={{
                      backgroundColor: getContrastColor(color.hex),
                      borderColor: color.hex
                    }}
                  />
                </motion.div>
              )}

              {/* Ripple effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: isHovered ? 1.2 : 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ backgroundColor: color.hex }}
              />
            </motion.button>
          )
        })}
      </div>

      {/* Custom Color Input */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center space-x-2">
          <label htmlFor="custom-color" className="text-sm text-muted-foreground">
            Custom:
          </label>
          <div className="relative">
            <input
              id="custom-color"
              type="color"
              value={currentColor?.hex || '#ffffff'}
              onChange={(e) => {
                const hex = e.target.value
                // Create a temporary color option
                const customColor = {
                  name: 'Custom',
                  value: 'custom',
                  hex: hex
                }
                // Add to colors if not exists, update if exists
                const updatedColors = colors.filter(c => c.value !== 'custom')
                updatedColors.push(customColor)
                onColorChange('custom')
              }}
              className="w-8 h-8 rounded cursor-pointer border border-border"
              title="Choose custom color"
            />
          </div>
        </div>
      </div>

      {/* Color Palette Presets */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Quick Palettes</div>
        <div className="flex space-x-2">
          {[
            { name: 'Monochrome', colors: ['#ffffff', '#d1d5db', '#6b7280', '#000000'] },
            { name: 'Vibrant', colors: ['#ef4444', '#f97316', '#eab308', '#22c55e'] },
            { name: 'Cool', colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'] },
            { name: 'Warm', colors: ['#f59e0b', '#ef4444', '#ec4899', '#f97316'] }
          ].map((palette) => (
            <button
              key={palette.name}
              onClick={() => {
                // Apply first color from palette
                const firstColor = colors.find(c => c.hex.toLowerCase() === palette.colors[0].toLowerCase())
                if (firstColor) {
                  onColorChange(firstColor.value)
                }
              }}
              className="flex space-x-1 p-1 rounded border border-border hover:border-primary/50 transition-colors"
              title={palette.name}
            >
              {palette.colors.map((hex, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ColorPicker
