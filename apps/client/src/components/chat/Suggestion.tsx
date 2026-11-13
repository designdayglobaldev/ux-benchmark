import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SuggestionProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
  className?: string;
}

/**
 * Official shadcn AI Elements-style Suggestion Component
 * Clean, minimal outline pills with subtle typography and clean arrow indicators
 */
export function Suggestion({ suggestions, onSelect, className }: SuggestionProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className={cn("w-full overflow-hidden mt-2", className)}>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#18181A] hover:bg-[#232326] active:scale-[0.98] border border-[#2E2E33] hover:border-[#4B4B52] text-left transition-all duration-150 cursor-pointer shrink-0 shadow-sm select-none"
          >
            <span className="text-[12.5px] font-normal tracking-[-0.01em] text-[#D4D4D8] group-hover:text-white transition-colors whitespace-nowrap">
              {suggestion}
            </span>
            <ArrowUpRight className="w-3 h-3 text-[#71717A] group-hover:text-[#E4E4E7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default Suggestion;
