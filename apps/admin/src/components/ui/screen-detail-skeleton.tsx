import { Skeleton } from "@/components/ui/skeleton"

export function ScreenDetailSkeleton() {
  return (
    <div className='flex h-screen w-full bg-background text-foreground overflow-hidden font-sans absolute inset-0 z-50'>
      
      {/* Left Column Skeleton */}
      <div className='w-[360px] flex-shrink-0 border-r bg-background flex flex-col'>
        <div className='p-4 border-b flex items-center justify-between'>
          <Skeleton className='h-8 w-32 rounded-md' />
          <Skeleton className='h-8 w-8 rounded-md' />
        </div>
        <div className='flex-1 p-6 space-y-8'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='space-y-3 mb-6'>
              <div className='flex justify-between items-center'>
                <Skeleton className='h-4 w-40' />
                <Skeleton className='h-4 w-4' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-5/6' />
                <Skeleton className='h-3 w-4/6' />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Column Skeleton */}
      <div className='flex-1 flex flex-col bg-muted/30 relative'>
        <div className='absolute left-4 top-1/2 -translate-y-1/2 z-10'>
          <Skeleton className='h-12 w-12 rounded-full' />
        </div>
        <div className='absolute right-4 top-1/2 -translate-y-1/2 z-10'>
          <Skeleton className='h-12 w-12 rounded-full' />
        </div>
        
        <div className='flex-1 flex items-center justify-center p-8'>
          <div className='relative w-full max-w-[340px] aspect-[9/19] rounded-[40px] border-[8px] border-black overflow-hidden shadow-2xl bg-background'>
            <Skeleton className='w-full h-full rounded-[32px]' />
          </div>
        </div>

        <div className='h-16 flex items-center justify-center gap-2 pb-4'>
          <Skeleton className='w-4 h-1.5 rounded-full' />
          <Skeleton className='w-1.5 h-1.5 rounded-full' />
          <Skeleton className='w-1.5 h-1.5 rounded-full' />
        </div>
      </div>

      {/* Right Column Skeleton */}
      <div className='w-[360px] flex-shrink-0 border-l bg-background h-full'>
        <div className='p-8 space-y-10'>
          
          {/* Header Info */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Skeleton className='w-4 h-4 rounded-full' />
              <Skeleton className='h-3 w-24' />
            </div>
            <Skeleton className='h-7 w-48' />
            <Skeleton className='h-4 w-32' />
          </div>

          <div className='w-full h-px bg-border' />

          {/* UI Elements */}
          <div className='space-y-3'>
            <Skeleton className='h-4 w-24' />
            <div className='flex flex-wrap gap-2'>
              <Skeleton className='h-7 w-20 rounded-md' />
              <Skeleton className='h-7 w-24 rounded-md' />
              <Skeleton className='h-7 w-16 rounded-md' />
            </div>
          </div>

          <div className='w-full h-px bg-border' />

          {/* Patterns */}
          <div className='space-y-3'>
            <Skeleton className='h-4 w-24' />
            <div className='flex flex-wrap gap-2'>
              <Skeleton className='h-7 w-24 rounded-md' />
              <Skeleton className='h-7 w-16 rounded-md' />
            </div>
          </div>

          <div className='w-full h-px bg-border' />

          {/* Flow */}
          <div className='space-y-3'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-7 w-32 rounded-md' />
          </div>

          {/* Flow Position */}
          <div className='space-y-3'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-8 w-12' />
            <Skeleton className='h-3 w-32' />
          </div>

        </div>
      </div>

    </div>
  )
}
