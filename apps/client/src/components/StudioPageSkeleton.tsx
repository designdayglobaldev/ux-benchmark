import { Skeleton } from "@/components/ui/skeleton";

export function StudioPageSkeleton() {
  return (
    <div className="flex-1 w-full min-h-[calc(100vh-64px)] bg-[#0C0C0C] flex flex-col p-6 animate-in fade-in duration-300">
      {/* Top action toolbar skeleton */}
      <div className="w-full flex items-center justify-between pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg bg-white/[0.04]" />
          <div className="space-y-1.5">
            <Skeleton className="w-32 h-4 rounded bg-white/[0.05]" />
            <Skeleton className="w-20 h-3 rounded bg-white/[0.03]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-8 rounded-lg bg-white/[0.04]" />
          <Skeleton className="w-28 h-8 rounded-lg bg-white/[0.05]" />
        </div>
      </div>

      {/* Main Canvas Placeholder Skeleton */}
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-center py-12 max-w-5xl mx-auto">
        {[1, 2, 3].map((col) => (
          <div key={col} className="flex flex-col items-center gap-4">
            <Skeleton className="w-[280px] h-[520px] rounded-[36px] bg-white/[0.03] border border-white/[0.05] shadow-2xl" />
            <Skeleton className="w-36 h-3 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
