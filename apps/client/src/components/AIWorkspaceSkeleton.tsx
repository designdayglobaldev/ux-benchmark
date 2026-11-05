import { Skeleton } from "@/components/ui/skeleton";

export function AIWorkspaceSkeleton() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full max-w-full bg-[#000000] text-white overflow-hidden font-sans animate-in fade-in duration-300">
      {/* 1. LEFT SIDEBAR PANEL SKELETON */}
      <aside
        className="shrink-0 bg-[#000000] flex flex-col justify-between z-10"
        style={{
          width: "280.62px",
          minWidth: "280.62px",
          maxWidth: "280.62px",
          paddingLeft: "43px",
          paddingTop: "42px",
          paddingRight: "38.62px",
          paddingBottom: "24px"
        }}
      >
        <div className="w-[199px] flex flex-col gap-3">
          {/* Top CTA: Start a Benchmark Skeleton */}
          <Skeleton className="w-[199px] h-[38px] rounded-[8px] bg-white/[0.06] border border-white/[0.05]" />

          {/* Secondary CTA: New Research Skeleton */}
          <Skeleton className="w-[199px] h-[38px] rounded-[8px] bg-[#171717] border border-[#323232]/50" />

          {/* Recent Researches Section Skeleton */}
          <div className="mt-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-28 rounded bg-white/[0.04] ml-1" />

            <div className="flex flex-col gap-2 mt-1">
              <Skeleton className="w-[199px] h-[36px] rounded-[8px] bg-white/[0.03]" />
            </div>
          </div>
        </div>
      </aside>

      {/* 2. CENTER HERO STAGE & RESEARCH CANVAS SKELETON */}
      <main
        className="flex-1 flex flex-col justify-between relative px-4 sm:px-8 py-7 overflow-y-auto overflow-x-hidden my-[19px] mr-[24px] min-w-0 max-w-full border border-white/[0.03]"
        style={{
          backgroundColor: "#161616",
          borderRadius: "16px"
        }}
      >
        {/* Ambient glow effect background */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] pointer-events-none rounded-full blur-[140px] opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(142, 68, 243, 0.45) 0%, rgba(255, 46, 121, 0.25) 50%, transparent 80%)"
          }}
        />

        {/* Center Bento Grid Recommendations Skeleton */}
        <div className="w-full max-w-[840px] mx-auto flex flex-col items-center my-auto z-10">
          <div className="flex flex-col items-center gap-3.5" style={{ width: "668px" }}>
            {/* Top Row Cards */}
            <div className="flex items-center justify-between w-full">
              {/* Card 1 Skeleton */}
              <div
                className="relative overflow-hidden p-4 flex flex-col justify-between"
                style={{
                  width: "324px",
                  height: "249px",
                  background: "#131313",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.05)"
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-48 rounded bg-white/[0.06]" />
                    <Skeleton className="h-4 w-32 rounded bg-white/[0.04]" />
                  </div>
                  <Skeleton className="w-6 h-6 rounded-full bg-white/[0.06] shrink-0" />
                </div>
                <div className="w-full flex justify-center mt-auto">
                  <Skeleton className="w-[230px] h-[140px] rounded-t-xl bg-white/[0.03] border-t border-x border-white/[0.05]" />
                </div>
              </div>

              {/* Card 2 Skeleton */}
              <div
                className="relative overflow-hidden p-4 flex flex-col justify-between"
                style={{
                  width: "324px",
                  height: "249px",
                  background: "#131313",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.05)"
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-48 rounded bg-white/[0.06]" />
                    <Skeleton className="h-4 w-36 rounded bg-white/[0.04]" />
                  </div>
                  <Skeleton className="w-6 h-6 rounded-full bg-white/[0.06] shrink-0" />
                </div>
                <div className="w-full flex justify-center mt-auto">
                  <Skeleton className="w-[230px] h-[140px] rounded-t-xl bg-white/[0.03] border-t border-x border-white/[0.05]" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bento Section Skeleton */}
          <div className="flex flex-col items-start gap-4 mt-5" style={{ width: "668px" }}>
            <Skeleton className="h-4 w-32 rounded bg-white/[0.06]" />

            {/* Wati Case Study Card Skeleton */}
            <div
              className="relative overflow-hidden p-4 flex flex-col justify-between"
              style={{
                width: "342px",
                height: "116px",
                background: "#202020",
                borderRadius: "15.8915px",
                border: "1px solid rgba(255, 255, 255, 0.05)"
              }}
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-64 rounded bg-white/[0.06]" />
                <Skeleton className="h-4 w-44 rounded bg-white/[0.04]" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-12 rounded bg-white/[0.05]" />
                <Skeleton className="h-3 w-6 rounded bg-white/[0.03]" />
                <div className="flex items-center -space-x-1.5">
                  <Skeleton className="w-[22px] h-[22px] rounded-full bg-white/[0.06]" />
                  <Skeleton className="w-[22px] h-[22px] rounded-full bg-white/[0.07]" />
                  <Skeleton className="w-[22px] h-[22px] rounded-full bg-white/[0.08]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM FLOATING PROMPT BAR SKELETON */}
        <div
          className="relative z-20 mt-6 mb-2 flex items-center justify-center shrink-0 self-center"
          style={{ width: "456px", height: "123.84px" }}
        >
          <div
            className="w-full h-full rounded-[30px] p-4 flex flex-col justify-between"
            style={{
              background: "#272727",
              border: "1px solid #363636",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.5)"
            }}
          >
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="w-5 h-5 rounded-full bg-white/[0.08]" />
              <Skeleton className="h-4 w-56 rounded bg-white/[0.05]" />
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full bg-white/[0.06]" />
                <Skeleton className="h-4 w-24 rounded bg-white/[0.04]" />
              </div>
              <Skeleton className="w-8 h-8 rounded-full bg-white/[0.08]" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

