import * as React from "react";
import { cn } from "@/lib/utils";

export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
  variant?: "default" | "muted" | "secondary";
}

export const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  ({ className, align = "start", variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-align={align}
        data-variant={variant}
        className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-2xl break-words",
          align === "end"
            ? "bg-[#252528] text-white rounded-br-sm border border-[#343438]"
            : "bg-[#18181A] text-[#E4E4E7] rounded-bl-sm border border-[#27272A]",
          variant === "muted" && "bg-[#1F1F23] border-[#2C2C30]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Bubble.displayName = "Bubble";

export interface BubbleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const BubbleContent = React.forwardRef<HTMLDivElement, BubbleContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
        {children}
      </div>
    );
  }
);
BubbleContent.displayName = "BubbleContent";

