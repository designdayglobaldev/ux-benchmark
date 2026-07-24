import { Skeleton } from "@/components/ui/skeleton"

export function AppCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border p-4 group">
      <div className="mb-4 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="ml-auto">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-12 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      
      <div className="mt-auto flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  )
}
