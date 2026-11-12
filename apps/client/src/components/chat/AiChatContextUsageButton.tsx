import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ZiboAiIcon } from "../ZiboAiIcon";
import { useBillingStatus } from "@/hooks/queries/useBillingStatus";

export function AiChatContextUsageButton() {
  const { data: billing } = useBillingStatus();

  // If user is PRO, their base monthly grant is 1000 credits; Free tier welcome is 50 credits
  const isPro = billing?.tier === "PRO";
  const limit = isPro ? 1000 : 50;
  const currentBalance = billing?.creditsBalance ?? 50;
  const consumed = Math.max(0, limit - currentBalance);
  const consumedPercentage = Math.min(100, Math.max(0, (consumed / limit) * 100));

  // Circular gauge math (radius = 6.5, circumference ≈ 40.84)
  const radius = 6.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (consumedPercentage / 100) * circumference;

  return (
    <Popover>
      {/* 1. Minimal Trigger: Circle + Remaining Quota Number */}
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-1.5 transition-all cursor-pointer select-none bg-transparent border-0 p-0 outline-none"
          title={`${currentBalance} credits remaining`}
        >
          {/* Progress Ring with Zibo Brand Gradient */}
          <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 16 16">
              <defs>
                <linearGradient id="ziboQuotaRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7213" />
                  <stop offset="100%" stopColor="#EF27A3" />
                </linearGradient>
              </defs>
              {/* Background Ring Track */}
              <circle
                cx="8"
                cy="8"
                r={radius}
                className="stroke-[#333333]"
                strokeWidth="2"
                fill="none"
              />
              {/* Active Segment */}
              <circle
                cx="8"
                cy="8"
                r={radius}
                stroke={currentBalance <= 10 ? "#EF4444" : "url(#ziboQuotaRingGrad)"}
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500 ease-out"
              />
            </svg>
          </div>

          {/* Clean Text: e.g. "50 credits left" */}
          <span className="text-[12px] font-medium tracking-tight text-[#A0A0A0] group-hover:text-white font-sans transition-colors">
            {currentBalance} credits
          </span>
        </button>
      </PopoverTrigger>

      {/* 2. Zibo-Branded Quota Popover Card */}
      <PopoverContent
        side="top"
        align="start"
        sideOffset={10}
        className="w-[285px] p-0 rounded-2xl bg-[#141414] border border-[#2B2B2B] text-white shadow-2xl overflow-hidden backdrop-blur-xl z-50 animate-in fade-in-50 zoom-in-95 duration-200"
      >
        {/* Header: Official Zibo AI Icon + Status */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#242424] bg-[#181818]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center p-0.5">
              <ZiboAiIcon size={14} color="#FFFFFF" />
            </div>
            <span className="text-[13px] font-semibold text-white tracking-tight">
              {isPro ? "PRO AI Credits" : "AI Credits Balance"}
            </span>
          </div>

          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              isPro
                ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {isPro ? "PRO" : "Free"}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3">
          {/* Main Large Metric */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold tracking-tight text-white font-sans">
                {currentBalance}
              </span>
              <span className="text-xs text-[#888888] ml-1.5 font-normal">
                credits available
              </span>
            </div>
            <span className="text-xs font-mono text-[#AAAAAA]">
              {limit} total
            </span>
          </div>

          {/* Zibo Signature Gradient Progress Bar (#FF7213 -> #EF27A3) */}
          <div className="w-full h-2 rounded-full bg-[#222222] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(100 - consumedPercentage, 4)}%`,
                background: "linear-gradient(96.75deg, #FF7213 0.78%, #EF27A3 99.22%)",
              }}
            />
          </div>

          <p className="text-[11.5px] text-[#8E8E8E] leading-relaxed m-0 pt-0.5">
            Each research query uses 10 credits. Benchmarks use 10 credits. Inspect and insights use 5 credits.
          </p>
        </div>

        {/* Footer Meta */}
        <div className="px-4 py-2.5 bg-[#101010] border-t border-[#222222] flex items-center justify-between text-[11px] text-[#777777]">
          <span>{isPro ? "Refills monthly with AutoPay" : "Upgrade for 1,000 monthly"}</span>
          <span
            className="font-medium"
            style={{
              background: "linear-gradient(96.75deg, #FF7213 0.78%, #EF27A3 99.22%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {isPro ? "PRO Tier" : "Hobby Tier"}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
