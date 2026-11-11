import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Gauge, Sparkles, Cpu, Layers, ChevronDown, Check } from "lucide-react";

interface AiUsageMetricsProps {
  usedTokens?: number;
  totalTokens?: number;
  queriesUsedToday?: number;
  queriesDailyLimit?: number;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export const AI_MODELS = [
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    tier: "Deep Benchmark Reasoning",
    description: "Multimodal UX analysis, flow comparison & friction detection",
    contextWindow: "200k tokens",
    speed: "Standard",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    tier: "Fast Screen Synthesis",
    description: "High-speed screen metadata & taxonomy tagging",
    contextWindow: "128k tokens",
    speed: "Fast",
  },
  {
    id: "voyage-multimodal-3",
    name: "Voyage Multimodal-3",
    tier: "Vector Vision Embedding",
    description: "Dense 1024-d visual feature similarity engine",
    contextWindow: "32k tokens",
    speed: "Instant",
  },
];

export function AiChatContextUsageButton({
  usedTokens = 4280,
  totalTokens = 128000,
  queriesUsedToday = 14,
  queriesDailyLimit = 50,
  selectedModel = "claude-3-5-sonnet",
  onModelChange,
}: AiUsageMetricsProps) {
  const [activeModel, setActiveModel] = useState(selectedModel);
  const [showDetails, setShowDetails] = useState(false);

  // Percentage calculations
  const tokenPercentage = Math.min(100, Math.max(0, (usedTokens / totalTokens) * 100));
  const queryPercentage = Math.min(100, Math.max(0, (queriesUsedToday / queriesDailyLimit) * 100));

  // Circular gauge math (radius = 6.5, circumference = 2 * PI * 6.5 ≈ 40.84)
  const radius = 6.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (tokenPercentage / 100) * circumference;

  // Format token counts (e.g. 4.3k / 128k)
  const formatK = (num: number) => (num >= 1000 ? `${(num / 1000).toFixed(1)}k` : `${num}`);

  const handleSelectModel = (modelId: string) => {
    setActiveModel(modelId);
    if (onModelChange) onModelChange(modelId);
  };

  const currentModelData = AI_MODELS.find((m) => m.id === activeModel) || AI_MODELS[0];

  return (
    <Popover>
      {/* 1. Mini Trigger Button inside the Sticky Chat Input */}
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-1.5 h-[26px] px-2 rounded-full bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] transition-all cursor-pointer text-[#C0C0C0] hover:text-white select-none shadow-sm"
          title={`Context Usage: ${tokenPercentage.toFixed(1)}% | ${queriesUsedToday}/${queriesDailyLimit} Daily Queries`}
        >
          {/* Twenty CRM Styled Progress Ring */}
          <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 16 16">
              {/* Background Ring Track */}
              <circle
                cx="8"
                cy="8"
                r={radius}
                className="stroke-[#333333]"
                strokeWidth="2"
                fill="none"
              />
              {/* Active Segment with Zibo Gradient / Color */}
              <circle
                cx="8"
                cy="8"
                r={radius}
                stroke={
                  tokenPercentage > 90
                    ? "#EF4444"
                    : tokenPercentage > 70
                    ? "#F59E0B"
                    : "#A873E8"
                }
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500 ease-out"
              />
            </svg>
          </div>

          {/* Compact Usage Percentage Label */}
          <span className="text-[11px] font-medium tracking-tight text-[#E0E0E0] font-sans">
            {tokenPercentage.toFixed(0)}%
          </span>

          <ChevronDown size={11} className="text-[#888888] group-hover:text-white transition-colors" />
        </button>
      </PopoverTrigger>

      {/* 2. Twenty CRM Information Card Popover */}
      <PopoverContent
        side="top"
        align="start"
        sideOffset={10}
        className="w-[330px] p-0 rounded-2xl bg-[#141414] border border-[#2B2B2B] text-white shadow-2xl overflow-hidden backdrop-blur-xl z-50 animate-in fade-in-50 zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#242424] bg-[#181818]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#A873E8]">
              <Gauge size={13} />
            </div>
            <span className="text-[13px] font-semibold text-white tracking-tight">
              AI Context & Credits
            </span>
          </div>

          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        </div>

        {/* Metric Rows */}
        <div className="p-4 flex flex-col gap-3.5">
          {/* Row 1: Context Window Capacity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-1.5 text-[#9E9E9E]">
                <Layers size={13} className="text-[#A873E8]" />
                <span>Context Window</span>
              </div>
              <span className="font-mono text-[11px] text-[#E0E0E0]">
                {formatK(usedTokens)} / {formatK(totalTokens)} ({tokenPercentage.toFixed(1)}%)
              </span>
            </div>

            {/* Segmented Progress Track */}
            <div className="w-full h-1.5 rounded-full bg-[#222222] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500"
                style={{ width: `${Math.max(tokenPercentage, 3)}%` }}
              />
            </div>
          </div>

          {/* Row 2: Daily Research Queries */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-1.5 text-[#9E9E9E]">
                <Sparkles size={13} className="text-[#F98537]" />
                <span>Daily AI Quota</span>
              </div>
              <span className="font-mono text-[11px] text-[#E0E0E0]">
                {queriesUsedToday} / {queriesDailyLimit} used
              </span>
            </div>

            {/* Segmented Progress Track */}
            <div className="w-full h-1.5 rounded-full bg-[#222222] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#F98537] to-[#A873E8]"
                style={{ width: `${Math.max(queryPercentage, 4)}%` }}
              />
            </div>
          </div>

          {/* Row 3: Model Selector / Tier */}
          <div className="pt-2 border-t border-[#242424] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[12px] text-[#9E9E9E]">
                <Cpu size={13} className="text-[#3B82F6]" />
                <span>Cognitive Model</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] text-[#A873E8] hover:underline cursor-pointer font-medium"
              >
                {showDetails ? "Collapse" : "Change"}
              </button>
            </div>

            {/* Active Model Pill */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B]">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-white">{currentModelData.name}</span>
                <span className="text-[10px] text-[#888888]">{currentModelData.tier}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2A2A2A] text-[#BBBBBB]">
                {currentModelData.contextWindow}
              </span>
            </div>

            {/* Expandable Model Switcher List */}
            {showDetails && (
              <div className="flex flex-col gap-1.5 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {AI_MODELS.map((model) => {
                  const isSelected = model.id === activeModel;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleSelectModel(model.id)}
                      className={`flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-600/15 border border-purple-500/40 text-white"
                          : "hover:bg-[#1E1E1E] text-[#AAAAAA] hover:text-white"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[12px] font-medium leading-tight">{model.name}</span>
                        <span className="text-[10px] text-[#777777]">{model.tier}</span>
                      </div>
                      {isSelected && <Check size={13} className="text-[#A873E8]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Subtext */}
        <div className="px-4 py-2 bg-[#121212] border-t border-[#242424] flex items-center justify-between text-[11px] text-[#666666]">
          <span>Resets daily at 00:00 UTC</span>
          <span className="text-[#A873E8] font-medium">Pro Workspace</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
