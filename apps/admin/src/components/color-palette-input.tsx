import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ColorPaletteInputProps {
  colors: string[]
  onChange: (colors: string[]) => void
}

const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

export function ColorPaletteInput({ colors, onChange }: ColorPaletteInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      processInput(inputValue, true) // Force process last item
    } else if (e.key === 'Backspace' && !inputValue && colors.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(colors.slice(0, -1))
    }
  }

  const processInput = (input: string, forceComplete: boolean = false) => {
    const parts = input.split(',')
    let newColors = [...colors]
    let remainingInput = ''
    let hasError = false

    parts.forEach((part, index) => {
      const cleanPart = part.trim()
      if (!cleanPart) return
      
      const formattedPart = cleanPart.startsWith('#') ? cleanPart : `#${cleanPart}`
      
      const isLastPart = index === parts.length - 1

      if (HEX_REGEX.test(formattedPart)) {
        // If it's not the last part, OR we are forcing completion (Enter key), add it
        if (!isLastPart || forceComplete) {
          if (!newColors.includes(formattedPart.toUpperCase())) {
            newColors.push(formattedPart.toUpperCase())
          }
        } else {
          // If it's the last part and we're just typing, keep it in the input (could be typing a 6-char hex)
          remainingInput = cleanPart
        }
      } else {
        // Invalid hex
        if (isLastPart && !forceComplete) {
          // Still typing
          remainingInput = cleanPart
        } else {
          // They forced completion or it was separated by comma, so it's a real error
          hasError = true
        }
      }
    })

    if (newColors.length !== colors.length) {
      onChange(newColors)
    }
    setInputValue(remainingInput)
    setError(hasError)
  }

  const removeColor = (colorToRemove: string) => {
    onChange(colors.filter((c) => c !== colorToRemove))
  }

  // Determine if a color is light or dark to pick the right text/X color
  const getContrastYIQ = (hexcolor: string) => {
    hexcolor = hexcolor.replace('#', '')
    if (hexcolor.length === 3) {
      hexcolor = hexcolor.split('').map(char => char + char).join('')
    }
    const r = parseInt(hexcolor.substr(0, 2), 16)
    const g = parseInt(hexcolor.substr(2, 2), 16)
    const b = parseInt(hexcolor.substr(4, 2), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return yiq >= 128 ? 'black' : 'white'
  }

  return (
    <div className='flex flex-col gap-2'>
      <div
        className={cn(
          'flex min-h-9 w-full flex-wrap gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring',
          error && 'border-destructive focus-within:ring-destructive'
        )}
      >
        {colors.map((color) => {
          const textColor = getContrastYIQ(color)
          return (
            <Badge
              key={color}
              variant='secondary'
              className='h-6 gap-1 px-2 text-xs font-medium border border-border/50'
              style={{ backgroundColor: color, color: textColor }}
            >
              {color}
              <button
                type='button'
                className='ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 opacity-70 hover:opacity-100 transition-opacity'
                onClick={() => removeColor(color)}
                style={{ color: textColor }}
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          )
        })}
        <input
          type='text'
          className='flex-1 bg-transparent outline-none min-w-[100px] placeholder:text-muted-foreground'
          placeholder={colors.length === 0 ? 'e.g. #000000, 1C2BFF (press Enter)' : ''}
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value
            // If they typed or pasted a comma, process it
            if (val.includes(',')) {
              processInput(val, false)
            } else {
              setInputValue(val)
              setError(false)
            }
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {error && (
        <p className='text-xs text-destructive'>
          Please enter a valid Hex code (e.g., #FFFFFF).
        </p>
      )}
    </div>
  )
}
