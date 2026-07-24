import React, { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const processInput = (input: string, forceComplete: boolean = false) => {
    const parts = input.split(',')
    let newTags = [...tags]
    let remainingInput = ''

    parts.forEach((part, index) => {
      const cleanPart = part.trim()
      if (!cleanPart) return
      
      const isLastPart = index === parts.length - 1

      if (!isLastPart || forceComplete) {
        if (!newTags.includes(cleanPart)) {
          newTags.push(cleanPart)
        }
      } else {
        remainingInput = cleanPart
      }
    })

    if (newTags.length !== tags.length) {
      onChange(newTags)
    }
    setInputValue(remainingInput)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      processInput(inputValue, true)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(tags.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove))
  }

  return (
    <div className='flex flex-col gap-2'>
      <div
        className={cn(
          'flex min-h-9 w-full flex-wrap gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring'
        )}
      >
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant='secondary'
            className='h-6 gap-1 px-2 text-xs font-medium border border-border/50'
          >
            {tag}
            <button
              type='button'
              className='ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 opacity-70 hover:opacity-100 transition-opacity'
              onClick={() => removeTag(tag)}
            >
              <X className='h-3 w-3' />
            </button>
          </Badge>
        ))}
        <input
          type='text'
          className='flex-1 bg-transparent outline-none min-w-[100px] placeholder:text-muted-foreground'
          placeholder={tags.length === 0 ? (placeholder || 'Type and press Enter...') : ''}
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value
            if (val.includes(',')) {
              processInput(val, false)
            } else {
              setInputValue(val)
            }
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  )
}
