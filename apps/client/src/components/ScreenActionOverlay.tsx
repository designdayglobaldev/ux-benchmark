import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { Bookmark, Copy, Check, Plus, FolderKanban, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ScreenActionOverlayProps {
  screenId?: string;
  imageUrl?: string;
  screenName?: string;
  appName?: string;
  isSavedInitial?: boolean;
  onSavedChange?: (saved: boolean) => void;
  className?: string;
  // If true, shows always (e.g. for inspection screen); otherwise reveals on group-hover
  alwaysVisible?: boolean;
}

export function ScreenActionOverlay({
  screenId,
  imageUrl,
  screenName: _screenName,
  appName: _appName,
  isSavedInitial = false,
  onSavedChange,
  className = "",
  alwaysVisible = false,
}: ScreenActionOverlayProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSaved, setIsSaved] = useState(isSavedInitial);
  const [isCopied, setIsCopied] = useState(false);
  const [savedBoardIds, setSavedBoardIds] = useState<Set<string>>(new Set());

  // Fetch collections when popover opens
  useEffect(() => {
    if (!isPopoverOpen || !user) return;
    const fetchWorkspaces = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/api/v1/workspaces/user/${user.id}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setWorkspaces(list);

        // Check which collections/boards already contain this screen
        if (screenId) {
          const containingBoardIds = new Set<string>();
          for (const ws of list) {
            for (const b of ws.boards || []) {
              if (b.screens?.some((s: any) => s.screenId === screenId)) {
                containingBoardIds.add(b.id);
              }
            }
          }
          setSavedBoardIds(containingBoardIds);
          if (containingBoardIds.size > 0) {
            setIsSaved(true);
            onSavedChange?.(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch collections", error);
      }
    };
    fetchWorkspaces();
  }, [isPopoverOpen, user, screenId, onSavedChange]);

  // Handle saving to a collection board
  const handleSaveToBoard = async (boardId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!user) {
      return;
    }
    if (!screenId) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
      await fetch(`${apiUrl}/api/v1/boards/${boardId}/screens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenId, userId: user.id }),
      });

      setSavedBoardIds((prev) => new Set(prev).add(boardId));
      setIsSaved(true);
      onSavedChange?.(true);
    } catch (error) {
      console.error("Failed to save to collection", error);
    }
  };

  // Quick create collection & board
  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newCollectionName.trim() || !user || isCreating) return;

    setIsCreating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
      let workspaceId = workspaces[0]?.id;

      if (!workspaceId) {
        const wsRes = await fetch(`${apiUrl}/api/v1/workspaces`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Personal Workspace", ownerId: user.id }),
        });
        const ws = await wsRes.json();
        workspaceId = ws.id;
      }

      const boardRes = await fetch(`${apiUrl}/api/v1/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName.trim(), workspaceId }),
      });
      const newBoard = await boardRes.json();

      if (screenId) {
        await handleSaveToBoard(newBoard.id);
      }

      setNewCollectionName("");
      // Refresh list
      const res = await fetch(`${apiUrl}/api/v1/workspaces/user/${user.id}`);
      const data = await res.json();
      setWorkspaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to create collection", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Copy screen image or link to clipboard
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (imageUrl) {
        // Try copying as image blob first, fallback to URL
        try {
          const resp = await fetch(imageUrl);
          const blob = await resp.blob();
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob }),
          ]);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
          return;
        } catch {
          // Fallback to copying URL string
          await navigator.clipboard.writeText(imageUrl);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
          return;
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 transition-all duration-200 ${
        alwaysVisible
          ? "opacity-100"
          : isPopoverOpen
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100"
      } ${className}`}
    >
      {/* 1. Bookmark / Save to Collection Button */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Save to collection"
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 shadow-md cursor-pointer ${
              isSaved
                ? "bg-white/20 border-white/40 text-white"
                : "bg-black/60 hover:bg-black/85 border-white/10 hover:border-white/30 text-white/80 hover:text-white"
            }`}
          >
            <Bookmark
              className={`w-4 h-4 transition-transform duration-200 ${
                isSaved ? "fill-white text-white scale-105" : "text-white"
              }`}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[230px] p-0 bg-[#161616]/95 backdrop-blur-xl border border-[#2B2B2B] rounded-2xl text-white shadow-2xl z-50 overflow-hidden font-['Inter']"
        >
          {/* Header: All Collections Link */}
          <div className="p-3 border-b border-[#262626]">
            <button
              type="button"
              onClick={() => {
                setIsPopoverOpen(false);
                navigate("/collections");
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-colors text-[13px] font-medium text-white group/all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                  <FolderKanban className="w-3.5 h-3.5 text-neutral-300" />
                </div>
                <span>All Collections</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#888] group-hover/all:text-white transition-colors" />
            </button>
          </div>

          {/* Quick Create Input */}
          <div className="p-3 border-b border-[#262626]">
            <span className="text-[11px] font-medium text-[#888888] block mb-2 px-1">
              Add to collections
            </span>
            <form onSubmit={handleQuickCreate} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Create collection..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="flex-1 bg-[#222222] border border-[#333333] focus:border-[#555555] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#666] outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!newCollectionName.trim() || isCreating}
                className="h-[29px] px-2.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-medium disabled:opacity-40 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Collections List */}
          <div className="p-2 max-h-52 overflow-y-auto custom-scrollbar flex flex-col gap-1">
            {workspaces.map((ws) =>
              (ws.boards || []).map((board: any) => {
                const isBoardSaved = savedBoardIds.has(board.id);
                return (
                  <button
                    key={board.id}
                    type="button"
                    onClick={(e) => handleSaveToBoard(board.id, e)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-xs text-[#E5E5E5] group/item cursor-pointer"
                  >
                    <span className="truncate pr-2 font-medium">{board.name}</span>
                    <Bookmark
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isBoardSaved
                          ? "fill-white text-white"
                          : "text-[#666] group-hover/item:text-white"
                      }`}
                    />
                  </button>
                );
              })
            )}

            {workspaces.length === 0 && (
              <div className="py-4 text-center text-xs text-[#777]">
                No collections yet. Create one above!
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* 2. Copy Image / Duplicate Button */}
      <button
        type="button"
        aria-label="Copy screen"
        onClick={handleCopy}
        className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/10 hover:border-white/30 flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 shadow-md cursor-pointer"
      >
        {isCopied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
