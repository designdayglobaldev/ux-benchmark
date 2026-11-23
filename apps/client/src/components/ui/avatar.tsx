import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

function Avatar({ className, ...props }: AvatarProps) {
  return (
    <div
      data-slot='avatar'
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full select-none',
        className
      )}
      {...props}
    />
  )
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

function AvatarImage({ className, onError, ...props }: AvatarImageProps) {
  const [hasError, setHasError] = React.useState(false)

  if (hasError || !props.src) {
    return null
  }

  return (
    <img
      data-slot='avatar-image'
      className={cn('aspect-square size-full object-cover', className)}
      onError={(e) => {
        setHasError(true)
        if (onError) onError(e)
      }}
      {...props}
    />
  )
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <div
      data-slot='avatar-fallback'
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-[#272727] text-white font-medium',
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
