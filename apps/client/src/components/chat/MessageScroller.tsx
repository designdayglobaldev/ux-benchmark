import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MessageScrollerProps {
  children: ReactNode;
  className?: string;
  autoScrollThreshold?: number; // Distance in px from bottom to consider "at bottom"
  smooth?: boolean;
}

export function MessageScroller({
  children,
  className,
  autoScrollThreshold = 120,
  smooth = true,
}: MessageScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isUserScrollingRef = useRef(false);

  const checkIfAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceToBottom <= autoScrollThreshold;
  }, [autoScrollThreshold]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = smooth ? "smooth" : "auto") => {
      if (bottomAnchorRef.current) {
        bottomAnchorRef.current.scrollIntoView({ behavior, block: "end" });
      } else if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior,
        });
      }
    },
    [smooth]
  );

  // Monitor user scroll position
  const handleScroll = () => {
    const atBottom = checkIfAtBottom();
    setShowScrollBottom(!atBottom);
    isUserScrollingRef.current = !atBottom;
  };

  // Mutation/Children observer to smoothly stick to bottom unless user scrolled up
  useEffect(() => {
    if (!isUserScrollingRef.current) {
      scrollToBottom();
    }
  }, [children, scrollToBottom]);

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-0 min-w-0">
      {/* Scrollable Message Viewport */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn(
          "w-full flex-1 overflow-y-auto overflow-x-hidden pr-1 relative",
          className
        )}
      >
        {children}
        <div ref={bottomAnchorRef} className="h-4 w-full shrink-0" />
      </div>

      {/* Floating Scroll to Bottom Action Pill */}
      {showScrollBottom && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#202022]/95 hover:bg-[#2A2A2E] text-white text-[12px] font-medium border border-[#37373C] shadow-xl backdrop-blur cursor-pointer transition-all active:scale-95 group"
          >
            <ArrowDown className="w-3.5 h-3.5 text-purple-400 group-hover:translate-y-0.5 transition-transform" />
            <span>Scroll to latest</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageScroller;

