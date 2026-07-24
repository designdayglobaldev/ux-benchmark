import { Skeleton } from "@/components/ui/skeleton"
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export function DetailPageSkeleton() {
  return (
    <>
      <Header>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-9 w-9 rounded-md' /> {/* Back Button */}
          <div className='flex items-center gap-2'>
            <Skeleton className='h-6 w-40' /> {/* Title */}
            <Skeleton className='h-5 w-16 rounded-full' /> {/* Badge */}
          </div>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Skeleton className='h-9 w-32 rounded-md' /> {/* Edit Button */}
          <Skeleton className='h-8 w-8 rounded-full' /> {/* Profile */}
        </div>
      </Header>

      <Main fixed>
        <div className='flex items-center justify-between mb-4'>
          <div className='space-y-2'>
            <Skeleton className='h-8 w-48' />
            <Skeleton className='h-4 w-96' />
          </div>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Skeleton className='h-9 w-40 lg:w-62.5 rounded-md' />
          </div>
        </div>
        <Separator className='shadow-sm' />

        {/* Use TableSkeleton as the generic content placeholder */}
        <TableSkeleton columns={4} />

        <div className='flex items-center justify-between px-2 py-4 mt-4'>
          <Skeleton className='h-4 w-40' />
          <div className='flex space-x-2'>
            <Skeleton className='h-8 w-20 rounded-md' />
            <Skeleton className='h-8 w-8 rounded-md' />
            <Skeleton className='h-8 w-20 rounded-md' />
          </div>
        </div>
      </Main>
    </>
  )
}
