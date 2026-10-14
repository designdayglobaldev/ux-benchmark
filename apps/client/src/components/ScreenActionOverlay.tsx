import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { Bookmark, Copy, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingInputOpen, setIsCreatingInputOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaved, setIsSaved] = useState(isSavedInitial);
  const [isCopied, setIsCopied] = useState(false);
  const [savedBoardIds, setSavedBoardIds] = useState<Set<string>>(new Set());

  // Fetch collections when popover opens
  useEffect(() => {
    if (!isPopoverOpen || !user) return;
    const fetchWorkspaces = async () => {
      setIsLoadingWorkspaces(true);
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
      } finally {
        setIsLoadingWorkspaces(false);
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
      setIsCreatingInputOpen(false);
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

  // Copy screen image directly to clipboard as PNG blob (OS clipboard requires image/png)
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (imageUrl) {
        try {
          // Load image element with crossOrigin anonymous
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Image failed to load for clipboard"));
            img.src = imageUrl;
          });

          // Draw onto canvas to generate native image/png
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");
          
          ctx.drawImage(img, 0, 0);

          const pngBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), "image/png");
          });

          if (!pngBlob) throw new Error("Failed to create PNG blob");

          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": pngBlob,
            }),
          ]);

          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
          return;
        } catch (imgErr) {
          console.warn("Direct image copy failed, falling back to text URL:", imgErr);
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
      <Popover 
        open={isPopoverOpen} 
        onOpenChange={(open) => {
          if (open && !user) {
            navigate("/login");
            return;
          }
          setIsPopoverOpen(open);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Save to collection"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                e.stopPropagation();
                navigate("/login");
              }
            }}
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
          className="w-[285px] p-4 bg-[#141517]/85 backdrop-blur-2xl border border-white/10 rounded-[24px] text-white shadow-[0_24px_60px_rgba(0,0,0,0.85)] z-50 overflow-hidden font-['Inter']"
        >
          {/* Header Row: All Collections */}
          <button
            type="button"
            onClick={() => {
              setIsPopoverOpen(false);
              navigate("/collections");
            }}
            className="w-full flex items-center justify-between p-2 rounded-[14px] hover:bg-white/5 transition-colors text-left group/all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-[38px] h-[38px] rounded-[12px] bg-[#222326] border border-white/5 flex items-center justify-center shrink-0">
                {/* 2x2 Grid / Layout icon matching mockup */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
              </div>
              <span className="text-[16px] font-medium text-white tracking-tight truncate">
                All Collections
              </span>
            </div>
            <Bookmark className="w-4 h-4 text-white/60 group-hover/all:text-white transition-colors shrink-0 mr-1" />
          </button>

          {/* Section Label */}
          <div className="px-2 pt-4 pb-2">
            <span className="text-[13px] font-medium text-[#737373] select-none">
              Add to collections
            </span>
          </div>

          {/* Create Collection Row */}
          {!isCreatingInputOpen ? (
            <button
              type="button"
              onClick={() => setIsCreatingInputOpen(true)}
              className="w-full flex items-center gap-3 p-2 rounded-[14px] hover:bg-white/5 transition-colors text-left cursor-pointer group/create"
            >
              <div className="w-[38px] h-[38px] rounded-[12px] bg-[#222326] border border-white/5 flex items-center justify-center shrink-0">
                <div className="w-5 h-5 rounded-full border border-white/50 flex items-center justify-center group-hover/create:border-white transition-colors">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-[15px] font-medium text-white tracking-tight">
                Create collection
              </span>
            </button>
          ) : (
            <form onSubmit={handleQuickCreate} className="p-1 mb-1 flex items-center gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="flex-1 bg-[#1e1f23] border border-white/10 rounded-[12px] px-3 py-2 text-[13px] text-white placeholder-white/40 outline-none focus:border-white/30 transition-colors"
              />
              <button
                type="submit"
                disabled={!newCollectionName.trim() || isCreating}
                className="w-8 h-8 rounded-[10px] bg-white text-black flex items-center justify-center shrink-0 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* User Collections List */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-1 mt-1">
            {isLoadingWorkspaces ? (
              /* Loading Skeleton Rows */
              <div className="space-y-1 py-1">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-full flex items-center justify-between p-2 rounded-[14px]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Squircle skeleton */}
                      <Skeleton className="w-[38px] h-[38px] rounded-[12px] bg-[#222326] shrink-0" />
                      {/* Name skeleton */}
                      <Skeleton className="h-4 w-28 bg-[#202124] rounded-md" />
                    </div>
                    {/* Bookmark icon skeleton */}
                    <Skeleton className="w-4 h-4 rounded-sm bg-[#202124] shrink-0 mr-1" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {workspaces.map((ws) =>
                  (ws.boards || []).map((board: any) => {
                    const isBoardSaved = savedBoardIds.has(board.id);
                    return (
                      <button
                        key={board.id}
                        type="button"
                        onClick={(e) => handleSaveToBoard(board.id, e)}
                        className="w-full flex items-center justify-between p-2 rounded-[14px] hover:bg-white/5 transition-colors text-left group/item cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Phone / Device icon squircle */}
                          <div className="w-[38px] h-[38px] rounded-[12px] bg-[#222326] border border-white/5 flex items-center justify-center shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                              <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                              <path d="M12 18h.01" />
                            </svg>
                          </div>
                          <span className="text-[15px] font-medium text-white tracking-tight truncate">
                            {board.name}
                          </span>
                        </div>
                        <Bookmark
                          className={`w-4 h-4 shrink-0 transition-colors mr-1 ${
                            isBoardSaved
                              ? "fill-white text-white"
                              : "text-white/50 group-hover/item:text-white"
                          }`}
                        />
                      </button>
                    );
                  })
                )}

                {workspaces.length === 0 && (
                  <div className="py-3 px-2 text-center text-xs text-[#666666]">
                    No collections yet. Tap &apos;Create collection&apos; above.
                  </div>
                )}
              </>
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
