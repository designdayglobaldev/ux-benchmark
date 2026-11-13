import * as React from "react";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { cn } from "@/lib/utils";

export interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  autoScroll?: boolean;
}

export function Conversation({
  autoScroll = true,
  children,
  className,
  ...props
}: ConversationProps) {
  return (
    <MessageScrollerProvider autoScroll={autoScroll}>
      <MessageScroller className={cn("relative flex w-full flex-1 flex-col min-h-0", className)} {...props}>
        {children}
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

export interface ConversationContentProps extends React.HTMLAttributes<HTMLDivElement> {
  autoScrollThreshold?: number;
}

export function ConversationContent({
  children,
  className,
  autoScrollThreshold,
  ...props
}: ConversationContentProps) {
  return (
    <MessageScrollerViewport autoScrollThreshold={autoScrollThreshold} className={className}>
      <MessageScrollerContent {...props}>
        {children}
      </MessageScrollerContent>
    </MessageScrollerViewport>
  );
}

export interface ConversationScrollButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function ConversationScrollButton(props: ConversationScrollButtonProps) {
  return <MessageScrollerButton {...props} />;
}

export interface ConversationEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ConversationEmptyState({
  title = "What should we build?",
  description = "Ask the agent to research design patterns, compare flows or inspect UI screens.",
  icon,
  className,
  children,
  ...props
}: ConversationEmptyStateProps) {
  return (
    <div
      className={cn("flex flex-1 flex-col items-center justify-center p-8 text-center", className)}
      {...props}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      {title && <h3 className="text-base font-medium text-white mb-1">{title}</h3>}
      {description && <p className="text-sm text-[#A1A1AA] max-w-sm">{description}</p>}
      {children}
    </div>
  );
}

export function messagesToMarkdown(messages: Array<{ role: string; content?: string }>): string {
  return messages
    .map((m) => `### ${m.role === "user" ? "User" : "Assistant"}\n\n${m.content || ""}`)
    .join("\n\n---\n\n");
}

export interface ConversationDownloadProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  messages: Array<{ role: string; content?: string }>;
  filename?: string;
}

export function ConversationDownload({
  messages,
  filename = "conversation.md",
  children,
  onClick,
  ...props
}: ConversationDownloadProps) {
  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    const md = messagesToMarkdown(messages);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" onClick={handleDownload} {...props}>
      {children || "Download transcript"}
    </button>
  );
}
