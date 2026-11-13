import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Trace = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2 w-full select-none", className)}
    {...props}
  />
));
Trace.displayName = "Trace";

const traceLineVariants = cva(
  "group relative flex items-center gap-2.5 text-xs transition-colors py-1",
  {
    variants: {
      status: {
        default: "text-[#D4D4D8]",
        running: "text-purple-300 font-medium",
        pending: "text-[#71717A]",
        completed: "text-[#E4E4E7]",
        error: "text-red-400",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
);

interface TraceLineProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof traceLineVariants> {}

const TraceLine = React.forwardRef<HTMLDivElement, TraceLineProps>(
  ({ className, status, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(traceLineVariants({ status }), className)}
      {...props}
    >
      {children}
    </div>
  )
);
TraceLine.displayName = "TraceLine";

const TraceIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5",
      className
    )}
    {...props}
  />
));
TraceIcon.displayName = "TraceIcon";

const TraceTitle = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("font-medium leading-relaxed tracking-[-0.01em] text-[13px]", className)}
    {...props}
  />
));
TraceTitle.displayName = "TraceTitle";

const TraceDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[11px] text-[#82828C] leading-normal m-0 pl-6", className)}
    {...props}
  />
));
TraceDescription.displayName = "TraceDescription";

const TraceCollapsible = CollapsiblePrimitive.Root;

const TraceCollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    ref={ref}
    className={cn(
      "w-full text-left transition-all hover:opacity-90 focus:outline-none cursor-pointer",
      className
    )}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.CollapsibleTrigger>
));
TraceCollapsibleTrigger.displayName = "TraceCollapsibleTrigger";

const TraceCollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent> & {
    keepMounted?: boolean;
  }
>(({ className, keepMounted, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    forceMount={keepMounted ? true : undefined}
    className={cn(
      "overflow-hidden data-[state=closed]:hidden data-[state=open]:animate-in data-[state=open]:fade-in-50 pt-2 pl-2 border-l border-[#2E2E34] ml-2",
      className
    )}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.CollapsibleContent>
));
TraceCollapsibleContent.displayName = "TraceCollapsibleContent";

export {
  Trace,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
};
