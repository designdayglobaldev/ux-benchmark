import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter } from '@/components/ui/card'

export function FlowCardSkeleton() {
  return (
    <Card className="group overflow-hidden border flex flex-col">
      <div className="relative h-32 bg-muted/30 p-4 flex items-center justify-center border-b overflow-hidden">
        {/* Abstract Representation Skeleton */}
        <div className="flex items-center justify-center space-x-4">
          <Skeleton className="w-10 h-16 rounded-sm shadow-sm" />
          <Skeleton className="w-4 h-1 rounded-sm" />
          <Skeleton className="w-10 h-16 rounded-sm shadow-sm translate-y-2" />
          <Skeleton className="w-4 h-1 rounded-sm" />
          <Skeleton className="w-10 h-16 rounded-sm shadow-sm" />
        </div>
        
        {/* Status Badge Skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 mb-1" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
      <CardFooter className="p-0 border-t">
        <div className="w-full flex items-center justify-center p-3">
          <Skeleton className="h-4 w-32" />
        </div>
      </CardFooter>
    </Card>
  )
}
