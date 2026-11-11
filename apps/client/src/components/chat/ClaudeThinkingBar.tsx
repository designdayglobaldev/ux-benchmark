import { useState, useEffect } from "react";

export const CLAUDE_THINKING_STEPS = [
  "Thinking...",
  "Searching design database...",
  "Analyzing UX patterns...",
  "Synthesizing benchmarks...",
];

export function ClaudeThinkingBar() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % CLAUDE_THINKING_STEPS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2.5 h-[34px] select-none">
      {/* 3 Bouncing Staggered Dots */}
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-claude-dot-1" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-claude-dot-2" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-claude-dot-3" />
      </div>

      {/* Shimmering Cycling Status Text with smooth fade */}
      <span
        key={stepIndex}
        className="text-[13.5px] font-normal tracking-[-0.01em] animate-claude-shimmer transition-opacity duration-300"
      >
        {CLAUDE_THINKING_STEPS[stepIndex]}
      </span>
    </div>
  );
}

