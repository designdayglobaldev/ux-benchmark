import * as React from "react";
import { cn } from "@/lib/utils";

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "center";
}

export const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, align = "start", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-align={align}
        className={cn(
          "flex w-full gap-3",
          align === "end" ? "justify-end" : align === "center" ? "justify-center" : "justify-start",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Message.displayName = "Message";

export interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-2 max-w-full min-w-0", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MessageContent.displayName = "MessageContent";

export interface MessageAvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const MessageAvatar = React.forwardRef<HTMLDivElement, MessageAvatarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("shrink-0 select-none", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MessageAvatar.displayName = "MessageAvatar";

export interface MessageFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const MessageFooter = React.forwardRef<HTMLDivElement, MessageFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-1 text-muted-foreground pt-1 select-none", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MessageFooter.displayName = "MessageFooter";

