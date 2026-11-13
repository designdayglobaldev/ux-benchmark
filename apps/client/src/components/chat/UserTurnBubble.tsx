import { useState } from "react";
import { Copy, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserMessageProps {
  content: string;
  onEdit?: (newContent: string) => void;
  className?: string;
  isFirstTurn?: boolean;
}

/**
 * Modern shadcn AI Elements-style User Message Component
 * Features rounded bubble with bottom-right action trigger icons (Copy & Edit)
 */
export function UserTurnBubble({ content, onEdit, className, isFirstTurn = false }: UserMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue.trim() !== content && onEdit) {
      onEdit(editValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col items-end mb-6 group select-text transition-all",
        // Pushes the previous conversation upward significantly, giving ChatGPT-like focus to the active turn
        !isFirstTurn ? "pt-12 sm:pt-16 border-t border-[#1C1C20]/70" : "pt-2",
        className
      )}
    >
      {/* User Bubble */}
      <div
        className={cn(
          "relative max-w-[640px] px-4 py-3 rounded-2xl bg-[#272727] text-white border border-[#333333] shadow-md transition-all",
          isEditing && "w-full"
        )}
        style={{
          borderRadius: "18px 18px 4px 18px",
        }}
      >
        {isEditing ? (
          <div className="flex flex-col gap-2 w-full">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white text-[14px] leading-[22px] rounded-lg p-2.5 border border-[#404040] focus:border-purple-500 focus:outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditValue(content);
                  setIsEditing(false);
                }}
                className="px-2.5 py-1 text-xs rounded-md hover:bg-[#333333] text-[#A1A1AA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1 text-xs font-medium rounded-md bg-white text-black hover:bg-neutral-200 cursor-pointer"
              >
                Save & Resubmit
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[14px] sm:text-[14.5px] leading-[22px] font-normal tracking-[-0.01em] text-[#F4F4F5] whitespace-pre-wrap break-words m-0">
            {content}
          </p>
        )}
      </div>

      {/* Floating Bottom-Right Action Icons (Copy & Edit) - Matches the uploaded screenshot */}
      {!isEditing && (
        <div className="flex items-center gap-1 mt-1.5 pr-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-md text-[#71717A] hover:text-white hover:bg-[#27272A] transition-all cursor-pointer"
            title={copied ? "Copied" : "Copy message"}
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-md text-[#71717A] hover:text-white hover:bg-[#27272A] transition-all cursor-pointer"
              title="Edit message"
              aria-label="Edit message"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default UserTurnBubble;
