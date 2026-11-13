import * as React from "react";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { Badge } from "@/components/ui/badge";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  LoaderCircleIcon,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusIcon({ status }: { status?: "running" | "error" }) {
  if (status === "running") {
    return <LoaderCircleIcon className="w-3.5 h-3.5 animate-spin text-purple-400" />;
  }

  return status === "error" ? (
    <CircleAlertIcon className="w-3.5 h-3.5 text-red-400" />
  ) : (
    <CircleCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
  );
}

export interface StepProps {
  title: string;
  status?: "running" | "error";
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

export function Step({
  title,
  status,
  defaultOpen,
  children,
}: StepProps) {
  const isRunning = status === "running";

  const line = (
    <TraceLine status={status}>
      <TraceIcon>
        <StatusIcon status={status} />
      </TraceIcon>
      <TraceTitle className={cn("text-xs text-[#E4E4E7]", isRunning && "shimmer shimmer-gradient font-medium")}>
        {title}
      </TraceTitle>
    </TraceLine>
  );

  if (!children) {
    return line;
  }

  return (
    <TraceCollapsible defaultOpen={defaultOpen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>{children}</TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

export interface ChainOfThoughtProps {
  steps?: Array<{
    id: string;
    title: string;
    status?: "running" | "error" | "completed";
    badges?: string[];
  }>;
  streaming?: boolean;
  answering?: boolean;
  defaultOpen?: boolean;
  durationSeconds?: number;
  className?: string;
}

export function ChainOfThought({
  steps,
  streaming = false,
  answering = true,
  defaultOpen,
  durationSeconds,
  className,
}: ChainOfThoughtProps) {
  const [open, setOpen] = React.useState<boolean>(defaultOpen ?? (streaming && !answering));
  const [elapsedSeconds, setElapsedSeconds] = React.useState<number>(durationSeconds || 0);
  const startTimeRef = React.useRef<number>(Date.now());
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const running = streaming && !answering;

  // Real-time elapsed stopwatch timer
  React.useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        const diff = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        setElapsedSeconds(diff);
      }, 500);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (durationSeconds) {
        setElapsedSeconds(durationSeconds);
      } else if (elapsedSeconds === 0) {
        setElapsedSeconds(Math.max(2, Math.round((Date.now() - startTimeRef.current) / 1000)));
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, durationSeconds]);

  const activeSteps = steps || [];
  const hasSteps = activeSteps.length > 0;

  const failed = activeSteps.filter((part) => part.status === "error").length;
  // If we are answering (response text is streaming), thinking is finished!
  const isCurrentlyThinking = running;
  const status = isCurrentlyThinking ? "running" : failed > 0 ? "error" : undefined;
  const displaySeconds = durationSeconds ? durationSeconds : Math.max(1, elapsedSeconds);

  return (
    <div className={cn("w-full py-1 mb-2 select-none", className)}>
      <Trace>
        <TraceCollapsible open={hasSteps && open} onOpenChange={setOpen}>
          <TraceCollapsibleTrigger disabled={!hasSteps}>
            <div className={cn("flex items-center justify-between w-full group py-0.5 transition-opacity", hasSteps ? "hover:opacity-90 cursor-pointer" : "cursor-default")}>
              <TraceLine status={status}>
                <TraceIcon>
                  <StatusIcon status={status} />
                </TraceIcon>
                <TraceTitle className="text-[13px] font-normal text-[#A1A1AA] group-hover:text-white transition-colors">
                  {isCurrentlyThinking ? (
                    <span className="shimmer shimmer-gradient font-medium tracking-tight">
                      Thinking... ({displaySeconds}s)
                    </span>
                  ) : (
                    `Thought for ${displaySeconds}s (${activeSteps.length} steps)${failed > 0 ? `, ${failed} failed` : ""}`
                  )}
                </TraceTitle>
              </TraceLine>

              {hasSteps && (
                <div className="flex items-center gap-1.5 text-[#71717A] text-[11px] group-hover:text-[#A1A1AA] transition-colors">
                  <span>{open ? "Hide reasoning" : "View reasoning"}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", open && "rotate-180")} />
                </div>
              )}
            </div>
          </TraceCollapsibleTrigger>

          {hasSteps && (
            <TraceCollapsibleContent keepMounted>
              <Trace className="mt-2 pl-2 border-l border-[#2E2E34] ml-2">
                {activeSteps.map((part) => (
                  <Step
                    key={part.id}
                    status={part.status === "running" ? "running" : part.status === "error" ? "error" : undefined}
                    title={part.title}
                  >
                    {part.badges && part.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1 pl-6">
                        {part.badges.map((badge) => (
                          <Badge key={badge} variant="secondary" className="bg-[#242428] text-[#A1A1AA] text-[10px] px-2 py-0.5 border border-[#34343A]">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Step>
                ))}
              </Trace>
            </TraceCollapsibleContent>
          )}
        </TraceCollapsible>
      </Trace>
    </div>
  );
}

export default ChainOfThought;
