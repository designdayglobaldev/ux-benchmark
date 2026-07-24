import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function AppOverviewSkeleton() {
  return (
    <div className='space-y-10 max-w-5xl mx-auto'>
      {/* Header Section Skeleton */}
      <div className='flex gap-6 items-start'>
        <div className='w-24 h-24 rounded-2xl flex-shrink-0'>
          <Skeleton className='w-full h-full rounded-2xl' />
        </div>
        <div className='space-y-3 flex-1 pt-1'>
          <div className='flex gap-2 flex-wrap items-center'>
            <Skeleton className='h-6 w-20 rounded-md' />
            <Skeleton className='h-6 w-16 rounded-md' />
            <Skeleton className='h-6 w-24 rounded-md' />
            <Skeleton className='h-6 w-20 rounded-md' />
          </div>
          <div className='space-y-2 max-w-3xl'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
          <div className='flex gap-4 items-center pt-1'>
            <Skeleton className='h-8 w-32 rounded-md' />
          </div>
        </div>
        
        <Card className='w-full md:w-64 flex-shrink-0'>
          <CardHeader className='pb-2'>
            <Skeleton className='h-4 w-32' />
          </CardHeader>
          <CardContent>
            <div className='flex gap-2 flex-wrap'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='w-10 h-10 rounded-full' />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Deep Dive Section Skeleton */}
      <div>
        <div className='flex items-center gap-2 mb-4'>
          <Skeleton className='h-6 w-36' />
        </div>
        
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8'>
          {/* Core Analysis Card Skeletons */}
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className='bg-muted/30 border-dashed'>
              <CardHeader className='pb-3'>
                <Skeleton className='h-5 w-32' />
              </CardHeader>
              <CardContent className='space-y-4'>
                <dl className='grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-4'>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className='sm:col-span-3 space-y-2'>
                      <Skeleton className='h-3 w-24' />
                      <Skeleton className='h-3 w-full' />
                      <Skeleton className='h-3 w-full' />
                      <Skeleton className='h-3 w-2/3' />
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dynamic Sections Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className='h-6 w-40' />
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex gap-2 flex-wrap mb-2'>
                  <Skeleton className='h-5 w-16 rounded-md' />
                  <Skeleton className='h-5 w-24 rounded-md' />
                  <Skeleton className='h-5 w-20 rounded-md' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-3 w-full' />
                  <Skeleton className='h-3 w-full' />
                  <Skeleton className='h-3 w-5/6' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
