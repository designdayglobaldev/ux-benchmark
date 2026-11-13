import * as React from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageScrollerContextValue {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  isAtBottom: boolean;
  autoScroll: boolean;
  registerItem: (id: string, el: HTMLElement, isAnchor?: boolean) => void;
  unregisterItem: (id: string) => void;
}

const MessageScrollerContext = React.createContext<MessageScrollerContextValue | null>(null);

export function useMessageScroller() {
  const ctx = React.useContext(MessageScrollerContext);
  if (!ctx) {
    throw new Error("useMessageScroller must be used within MessageScrollerProvider");
  }
  return ctx;
}

export interface MessageScrollerProviderProps {
  children: React.ReactNode;
  autoScroll?: boolean;
}

export function MessageScrollerProvider({
  children,
  autoScroll = true,
}: MessageScrollerProviderProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const isAtBottom = true;
  const itemsMapRef = React.useRef<Map<string, { el: HTMLElement; isAnchor?: boolean }>>(new Map());

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
  }, []);

  const registerItem = React.useCallback((id: string, el: HTMLElement, isAnchor?: boolean) => {
    itemsMapRef.current.set(id, { el, isAnchor });
  }, []);

  const unregisterItem = React.useCallback((id: string) => {
    itemsMapRef.current.delete(id);
  }, []);

  const value = React.useMemo<MessageScrollerContextValue>(
    () => ({
      viewportRef,
      scrollToBottom,
      isAtBottom,
      autoScroll,
      registerItem,
      unregisterItem,
    }),
    [scrollToBottom, isAtBottom, autoScroll, registerItem, unregisterItem]
  );

  return (
    <MessageScrollerContext.Provider value={value}>
      {children}
    </MessageScrollerContext.Provider>
  );
}

export interface MessageScrollerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const MessageScroller = React.forwardRef<HTMLDivElement, MessageScrollerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative flex w-full flex-1 flex-col min-h-0 min-w-0", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MessageScroller.displayName = "MessageScroller";

export interface MessageScrollerViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  autoScrollThreshold?: number;
}

export const MessageScrollerViewport = React.forwardRef<HTMLDivElement, MessageScrollerViewportProps>(
  ({ className, children, autoScrollThreshold = 120, onScroll, ...props }, forwardedRef) => {
    const { viewportRef, isAtBottom, autoScroll } = useMessageScroller();
    const localRef = React.useRef<HTMLDivElement | null>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      onScroll?.(e);
      const el = e.currentTarget;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= autoScrollThreshold;
      if (atBottom !== isAtBottom) {
        // Track edge state
      }
    };

    // Smooth live auto-scroll when content grows or streams
    React.useEffect(() => {
      const el = localRef.current;
      if (!el || !autoScroll) return;

      let rafId: number | null = null;
      let isUserInteracting = false;

      const onWheelOrTouch = () => {
        isUserInteracting = true;
        setTimeout(() => {
          isUserInteracting = false;
        }, 800);
      };

      el.addEventListener("wheel", onWheelOrTouch, { passive: true });
      el.addEventListener("touchmove", onWheelOrTouch, { passive: true });

      const observer = new MutationObserver(() => {
        if (isUserInteracting) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distanceFromBottom <= autoScrollThreshold + 200) {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          });
        }
      });

      observer.observe(el, { childList: true, subtree: true, characterData: true });
      return () => {
        observer.disconnect();
        el.removeEventListener("wheel", onWheelOrTouch);
        el.removeEventListener("touchmove", onWheelOrTouch);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, [autoScroll, autoScrollThreshold]);

    return (
      <div
        ref={(node) => {
          localRef.current = node;
          (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        onScroll={handleScroll}
        data-message-scroller-viewport="true"
        className={cn("w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MessageScrollerViewport.displayName = "MessageScrollerViewport";

export interface MessageScrollerContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const MessageScrollerContent = React.forwardRef<HTMLDivElement, MessageScrollerContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col w-full min-w-0 pb-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MessageScrollerContent.displayName = "MessageScrollerContent";

export interface MessageScrollerItemProps extends React.HTMLAttributes<HTMLDivElement> {
  messageId?: string;
  scrollAnchor?: boolean;
}

export const MessageScrollerItem = React.forwardRef<HTMLDivElement, MessageScrollerItemProps>(
  ({ className, messageId, scrollAnchor, children, ...props }, forwardedRef) => {
    const { registerItem, unregisterItem } = useMessageScroller();
    const itemRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      const el = itemRef.current;
      if (el && messageId) {
        registerItem(messageId, el, scrollAnchor);
      }
      return () => {
        if (messageId) unregisterItem(messageId);
      };
    }, [messageId, scrollAnchor, registerItem, unregisterItem]);

    return (
      <div
        ref={(node) => {
          itemRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-message-id={messageId}
        data-scroll-anchor={scrollAnchor ? "true" : undefined}
        className={cn("w-full min-w-0", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MessageScrollerItem.displayName = "MessageScrollerItem";

export interface MessageScrollerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isStreaming?: boolean;
}

export const MessageScrollerButton = React.forwardRef<HTMLButtonElement, MessageScrollerButtonProps>(
  ({ className, isStreaming = false, children, onClick, ...props }, ref) => {
    const { viewportRef, scrollToBottom } = useMessageScroller();
    const [isScrolledUp, setIsScrolledUp] = React.useState(false);

    React.useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;

      const check = () => {
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 140;
        setIsScrolledUp(!atBottom);
      };

      el.addEventListener("scroll", check, { passive: true });
      check();
      return () => el.removeEventListener("scroll", check);
    }, [viewportRef]);

    // ChatGPT behavior:
    // When the user has scrolled up, show the button.
    // If it's actively streaming content, show the bouncing/pulsing 3-dots indicator!
    // If idle, show the round arrow-down pill.
    if (!isScrolledUp) return null;

    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-200">
        <button
          ref={ref}
          type="button"
          onClick={(e) => {
            onClick?.(e);
            scrollToBottom("smooth");
          }}
          className={cn(
            "flex items-center justify-center transition-all cursor-pointer shadow-2xl backdrop-blur group active:scale-95",
            isStreaming
              ? "px-3.5 py-2 rounded-full bg-[#1F1F23]/95 hover:bg-[#28282D] border border-[#3E3E48] text-white gap-1.5"
              : "w-8 h-8 rounded-full bg-[#202022]/95 hover:bg-[#2A2A2E] border border-[#37373C] text-white",
            className
          )}
          title="Scroll to bottom"
          {...props}
        >
          {children ? (
            children
          ) : isStreaming ? (
            /* ChatGPT-style 3 dots bouncing animation while streaming */
            <div className="flex items-center gap-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
            </div>
          ) : (
            <ArrowDown className="w-4 h-4 text-[#A873E8] group-hover:translate-y-0.5 transition-transform" />
          )}
        </button>
      </div>
    );
  }
);
MessageScrollerButton.displayName = "MessageScrollerButton";
