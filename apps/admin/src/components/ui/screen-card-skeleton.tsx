import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from '@/components/ui/card'

export function ScreenCardSkeleton() {
  return (
    <Card className="group overflow-hidden border shadow-sm flex flex-col">
      <div className="relative w-full aspect-[3/4] border-b flex items-center justify-center overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      <CardContent className="p-3 bg-card flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}
