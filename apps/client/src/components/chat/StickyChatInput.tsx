import React, { useState, useRef, useEffect } from "react";
import { Plus, ArrowUp, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ZiboAiIcon } from "../ZiboAiIcon";
import { useAIChatStore } from "../../stores/useAIChatStore";

interface StickyChatInputProps {
  onSendMessage: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function StickyChatInput({
  onSendMessage,
  isLoading = false,
  placeholder = "Ask how your design is blocking you",
}: StickyChatInputProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortCurrentTurn = useAIChatStore((state) => state.abortCurrentTurn);

  // Auto-grow textarea up to max-height without scrollbars jumping
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 72)}px`;
    }
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSendMessage(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends message; Shift+Enter creates a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 pt-3 pb-0 flex items-center justify-center shrink-0 w-full bg-gradient-to-t from-[#161616] via-[#161616]/95 to-transparent backdrop-blur-[2px]">
      {/* Container: Exactly 456px wide matching the Figma Command Bar */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: "456px", minHeight: "123.84px" }}
      >
        {/* Exact Figma Glow (Restored 1:1) with Continuous Flow Animation */}
        <div
          className={`absolute pointer-events-none ${
            isLoading ? "animate-glow-flow-fast" : "animate-glow-flow"
          }`}
          style={{
            width: "452px",
            height: "114.47px",
            left: "2px",
            top: "9.38px",
            background:
              "linear-gradient(90.01deg, #FF924A 0%, #6396ED 25%, #F612A6 50%, #FF924A 75%, #6396ED 100%)",
            opacity: isLoading ? 0.85 : 0.64,
            filter: "blur(11.55px)",
            borderRadius: "20px",
            zIndex: 0,
          }}
        />

        {/* Outer Glass Frame */}
        <div
          className="relative w-full"
          style={{
            minHeight: "118px",
            background: "rgba(255, 255, 255, 0.18)",
            borderRadius: "20px",
            zIndex: 1,
            padding: "3.5px",
          }}
        >
          {/* Inner Dark Gradient Surface */}
          <div
            className="relative w-full flex flex-col justify-between"
            style={{
              minHeight: "111px",
              background: "linear-gradient(96.72deg, #2C2C2C 0.02%, #050505 99.98%)",
              borderRadius: "17px",
              padding: "12px 14px 10px 14px",
            }}
          >
            {/* Top Row: AI Symbol + Multiline Textarea */}
            <div className="flex items-start gap-2.5 w-full">
              {/* Zibo AI Symbol SVG */}
              <div
                className="flex items-center justify-center shrink-0 mt-0.5 pointer-events-none"
                style={{ width: "23px", height: "23px" }}
              >
                <ZiboAiIcon size={22} />
              </div>

              {/* Multiline Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={isLoading ? "Analyzing design patterns..." : placeholder}
                className="flex-1 bg-transparent text-white focus:outline-none placeholder:text-[rgba(255,255,255,0.6)] resize-none no-scrollbar"
                style={{
                  fontFamily: "'Geist', 'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "-0.24px",
                  maxHeight: "72px",
                  minHeight: "22px",
                }}
              />
            </div>

            {/* Bottom Row: Actions (Plus, Research mode, Send) */}
            <div className="flex items-center justify-between w-full pt-2">
              <div className="flex items-center gap-2">
                {/* Plus / Upload Button */}
                <button
                  type="button"
                  onClick={() => navigate("/benchmark")}
                  className="cursor-pointer flex items-center justify-center transition-colors hover:bg-[#4A4A4A] shrink-0"
                  style={{
                    boxSizing: "border-box",
                    width: "32px",
                    height: "32px",
                    background: "#3C3C3C",
                    border: "1px solid #4F4F4F",
                    borderRadius: "17px",
                  }}
                  title="Upload screenshot or benchmark"
                >
                  <Plus size={16} color="#E3E3E3" strokeWidth={2} />
                </button>

                {/* Research Mode Pill */}
                <div
                  className="flex items-center"
                  style={{
                    gap: "5px",
                    height: "16px",
                  }}
                >
                  {/* Binoculars Icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="stickyBinocGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="18.7%" stopColor="#F48E4A" />
                        <stop offset="97.74%" stopColor="#A873E8" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M7 6C4.79 6 3 7.79 3 10V18C3 19.1 3.9 20 5 20C6.1 20 7 19.1 7 18V6ZM17 6C14.79 6 13 7.79 13 10V18C13 19.1 13.9 20 15 20C16.1 20 17 19.1 17 18V6Z"
                      fill="url(#stickyBinocGrad)"
                    />
                    <rect x="7" y="10" width="6" height="2" rx="1" fill="url(#stickyBinocGrad)" />
                  </svg>
                  <span
                    style={{
                      fontFamily: "'Geist', 'Inter', sans-serif",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "16px",
                      letterSpacing: "-0.24px",
                      background: "linear-gradient(92.38deg, #F98537 1.05%, #A873E8 98.95%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Research mode
                  </span>
                </div>
              </div>

              {/* Send / Stop Generating Button (ChatGPT / Claude.ai standard) */}
              {isLoading ? (
                <button
                  type="button"
                  onClick={abortCurrentTurn}
                  className="cursor-pointer flex items-center justify-center transition-all shrink-0 hover:bg-[#333333] active:scale-95"
                  style={{
                    boxSizing: "border-box",
                    width: "32px",
                    height: "32px",
                    background: "#222222",
                    boxShadow: "inset 0.5px 0.5px 0.5px rgba(99, 99, 99, 0.56)",
                    borderRadius: "28px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    outline: "none",
                  }}
                  title="Stop generating"
                >
                  <Square size={13} fill="#FFFFFF" color="#FFFFFF" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!value.trim()}
                  onClick={() => handleSubmit()}
                  className={`cursor-pointer flex items-center justify-center transition-all shrink-0 ${
                    value.trim() ? "hover:opacity-90 active:scale-95" : "opacity-80 cursor-default"
                  }`}
                  style={{
                    boxSizing: "border-box",
                    width: "32px",
                    height: "32px",
                    background: "linear-gradient(142.66deg, #FFFFFF 5.13%, #C6C6C6 94.87%)",
                    boxShadow: "inset 0.5px 0.5px 0.5px rgba(99, 99, 99, 0.56)",
                    borderRadius: "28px",
                    border: "none",
                    outline: "none",
                  }}
                  title="Send message"
                >
                  <ArrowUp size={15} color="#1A1A1A" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
