import { useState, useRef, useEffect, DragEvent, ClipboardEvent, ChangeEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageDropzoneProps {
  label: string
  value?: string | File | null
  onImageSelect?: (file: File | null) => void
}

export function ImageDropzone({ label, value, onImageSelect }: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof value === 'string' && value) {
      setPreviewUrl(value)
    } else if (!value) {
      setPreviewUrl(null)
    }
  }, [value])

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      if (onImageSelect) onImageSelect(file)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      handleFile(e.clipboardData.files[0])
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (onImageSelect) onImageSelect(null)
  }

  return (
    <div className='grid gap-3'>
      <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
        {label}
      </label>
      <div
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/10'}
          ${previewUrl ? 'p-2' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <input
          type='file'
          ref={fileInputRef}
          className='hidden'
          accept='image/*'
          onChange={handleChange}
        />
        
        {previewUrl ? (
          <div className='relative w-full h-full flex items-center justify-center group'>
            <img 
              src={previewUrl} 
              alt='Preview' 
              className='max-h-[150px] w-auto rounded-md object-contain' 
            />
            <Button
              type='button'
              variant='destructive'
              size='icon'
              className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8'
              onClick={handleRemove}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        ) : (
          <div className='flex flex-col items-center gap-4 text-muted-foreground text-center'>
            <div className='flex flex-col items-center gap-1 pointer-events-none'>
              <ImagePlus className='h-8 w-8 opacity-50 mb-2' />
              <p className='text-sm font-medium'>Click box to select, then Ctrl+V to paste</p>
              <p className='text-xs opacity-70'>or drag and drop an image</p>
            </div>
            <Button 
              type='button' 
              variant='secondary' 
              size='sm'
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
