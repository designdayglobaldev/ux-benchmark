import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { Plus, FolderKanban, Loader2, Lock, MoreVertical, ExternalLink } from "lucide-react";
import workspaceEmptyScreen from "@/assets/workspace-empty-scren.png";
import revolutImg from "@/assets/Revolut.png";
import canvasImg from "@/assets/Canvas.png";
import authImg from "@/assets/auth.png";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CollectionItem {
  id: string;
  name: string;
  itemCount: number;
  itemText?: string;
  isLocked?: boolean;
  previewImage?: string | null;
  members?: Array<{ id: string; name?: string; initial: string; bg: string }>;
  isCustom?: boolean;
  boardId?: string;
}

export function Workspaces() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-collections' | 'shared'>('my-collections');
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Default mock collections matching the exact Figma design
  const defaultCollections: CollectionItem[] = [
    {
      id: "default-1",
      name: "Dashboards",
      itemCount: 43,
      itemText: "43 items",
      isLocked: false,
      previewImage: revolutImg,
      members: [
        { id: "m1", initial: "J", bg: "bg-[#e0a96d] text-[#3d2b1f]" },
        { id: "m2", initial: "A", bg: "bg-[#f4a261] text-[#264653]" },
        { id: "m3", initial: "S", bg: "bg-[#e76f51] text-white" }
      ]
    },
    {
      id: "default-2",
      name: "Account management",
      itemCount: 12,
      itemText: "12 items",
      isLocked: true,
      previewImage: canvasImg,
      members: []
    },
    {
      id: "default-3",
      name: "Profile and Settings",
      itemCount: 8,
      itemText: "08 items",
      isLocked: true,
      previewImage: authImg,
      members: []
    },
    {
      id: "default-4",
      name: "Drafts",
      itemCount: 0,
      itemText: "No items",
      isLocked: false,
      previewImage: null,
      members: []
    }
  ];

  const fetchWorkspaces = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/workspaces/user/${user.id}`);
      const data = await res.json();
      setWorkspaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch workspaces", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !user) return;
    setIsCreatingWorkspace(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/api/v1/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName.trim(), ownerId: user.id }),
      });
      setIsDialogOpen(false);
      setNewWorkspaceName("");
      fetchWorkspaces();
    } catch (error) {
      console.error("Failed to create workspace", error);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleOpenCreate = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  // Convert real database workspaces into collection items
  const customCollections: CollectionItem[] = (workspaces || []).map((ws) => {
    let totalScreens = 0;
    let firstScreenUrl: string | null = null;
    let firstBoardId: string | undefined = undefined;

    if (ws.boards && ws.boards.length > 0) {
      firstBoardId = ws.boards[0].id;
      for (const board of ws.boards) {
        if (board.screens) {
          totalScreens += board.screens.length;
          if (!firstScreenUrl && board.screens.length > 0) {
            firstScreenUrl = board.screens[0].screen?.imageUrl || null;
          }
        }
      }
    }

    return {
      id: ws.id,
      name: ws.name,
      itemCount: totalScreens,
      itemText: totalScreens === 0 ? "No items" : `${totalScreens} ${totalScreens === 1 ? 'item' : 'items'}`,
      isLocked: false,
      previewImage: firstScreenUrl,
      isCustom: true,
      boardId: firstBoardId,
      members: (ws.members || []).map((m: any, idx: number) => ({
        id: m.userId || `${idx}`,
        initial: (m.user?.email || "U")[0].toUpperCase(),
        bg: "bg-[#d4a373] text-[#3d2b1f]"
      }))
    };
  });

  // Display user collections if created, combined with or falling back to the design collections
  const activeCollections: CollectionItem[] = customCollections.length > 0 
    ? [...customCollections, ...defaultCollections.slice(customCollections.length < 4 ? customCollections.length : 4)]
    : defaultCollections;

  const isSharedEmpty = activeTab === 'shared';

  return (
    <main className="flex-1 w-full bg-[#0A0A0A] text-white flex flex-col min-h-[calc(100vh-64px)] px-6 sm:px-10 lg:px-16 pt-8 pb-20">
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col">
        
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-[28px] sm:text-[32px] font-semibold text-white tracking-tight">
            Collections
          </h1>
        </div>

        {/* Subheader: Left Tabs & Right "+ Create Collection" Button */}
        <div className="flex items-center justify-between gap-4 mb-8">
          {/* Pill Toggle (My Collections / Shared With Me) */}
          <div className="inline-flex p-1 bg-[#151515] border border-[#242424] rounded-full gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('my-collections')}
              className={cn(
                "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer",
                activeTab === 'my-collections'
                  ? "bg-[#282828] text-white border border-[#3A3A3A] shadow-sm"
                  : "text-[#888888] hover:text-[#CCCCCC]"
              )}
            >
              My Collections
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shared')}
              className={cn(
                "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer",
                activeTab === 'shared'
                  ? "bg-[#282828] text-white border border-[#3A3A3A] shadow-sm"
                  : "text-[#888888] hover:text-[#CCCCCC]"
              )}
            >
              Shared With Me
            </button>
          </div>

          {/* "+ Create Collection" Button (Floated to right, exact design) */}
          <Button
            onClick={handleOpenCreate}
            className="bg-white hover:bg-neutral-200 text-black text-[13px] font-medium px-4 py-2 h-[38px] rounded-[8px] flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Collection</span>
          </Button>
        </div>

        {/* Body Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex flex-col">
                {/* Thumbnail Skeleton Box */}
                <div className="relative w-full aspect-[4/5] bg-[#121212] border border-[#222222] rounded-[22px] overflow-hidden p-3.5 flex flex-col justify-between">
                  {/* Top Bar Skeleton */}
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-7 h-7 rounded-full bg-[#1C1C1C]" />
                    <Skeleton className="w-5 h-5 rounded-md bg-[#1C1C1C]" />
                  </div>
                  {/* Center Phone Frame Skeleton */}
                  <div className="absolute inset-x-5 bottom-0 top-10 flex justify-center overflow-hidden pointer-events-none">
                    <div className="w-full max-w-[210px] h-full bg-[#171717] rounded-t-[28px] border-t-2 border-x-2 border-[#242424] pt-2.5 px-2 flex flex-col">
                      <Skeleton className="w-12 h-1 rounded-full mx-auto mb-2 bg-[#262626]" />
                      <Skeleton className="flex-1 w-full rounded-t-[20px] bg-[#1D1D1D]" />
                    </div>
                  </div>
                </div>
                {/* Details Skeleton */}
                <div className="mt-3.5 flex items-start justify-between px-1">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32 bg-[#1C1C1C] rounded" />
                    <Skeleton className="h-3 w-16 bg-[#161616] rounded" />
                  </div>
                  {idx === 0 && (
                    <div className="flex items-center -space-x-1.5 shrink-0 pt-0.5">
                      <Skeleton className="w-[22px] h-[22px] rounded-full bg-[#1C1C1C]" />
                      <Skeleton className="w-[22px] h-[22px] rounded-full bg-[#262626]" />
                      <Skeleton className="w-[22px] h-[22px] rounded-full bg-[#303030]" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : isSharedEmpty ? (
          /* Empty State for Shared With Me */
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-16 sm:py-24 select-none">
            <div className="relative mb-6 flex items-center justify-center">
              <img 
                src={workspaceEmptyScreen} 
                alt="Empty Shared Collections" 
                className="w-[170px] sm:w-[200px] h-auto object-contain opacity-80 pointer-events-none" 
              />
            </div>
            <h2 className="text-white text-[20px] sm:text-[22px] font-semibold tracking-tight mb-2">
              No shared collections yet
            </h2>
            <p className="text-[#8E8E8E] text-[13px] sm:text-[14px] max-w-[430px] font-normal leading-relaxed text-center mb-6 px-4">
              When teammates share collections or boards with you, they will appear right here.
            </p>
          </div>
        ) : (
          /* Populated Collections Grid (Exact 4-column design) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {activeCollections.map((col) => (
              <div 
                key={col.id} 
                className="group flex flex-col cursor-pointer"
                onClick={() => {
                  navigate(`/boards/${col.boardId || col.id}`);
                }}
              >
                {/* Card Thumbnail Box */}
                <div className="relative w-full aspect-[4/5] bg-[#121212] border border-[#222222] rounded-[22px] overflow-hidden flex flex-col justify-between group-hover:border-[#383838] transition-all shadow-lg">
                  {/* Top Bar inside Card */}
                  <div className="relative z-20 flex items-center justify-between p-3.5 pointer-events-none">
                    {/* Top Left: Optional Lock Badge */}
                    {col.isLocked ? (
                      <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 pointer-events-auto">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7" />
                    )}

                    {/* Top Right: 3-Dots Menu */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label="Collection options"
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[#777777] hover:text-white transition-colors cursor-pointer pointer-events-auto focus:outline-none"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        align="end" 
                        sideOffset={6}
                        className="w-44 p-1.5 bg-[#181818] border border-[#2E2E2E] rounded-xl text-white shadow-2xl z-50 text-[13px]"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (col.boardId) navigate(`/boards/${col.boardId}`);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#CCCCCC] hover:text-white hover:bg-[#242424] transition-colors text-left cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#CCCCCC] hover:text-white hover:bg-[#242424] transition-colors text-left cursor-pointer"
                        >
                          <FolderKanban className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Card Center: Phone Preview or Empty Graphic */}
                  {col.itemCount > 0 && col.previewImage ? (
                    /* Mobile Device Mockup Frame anchored at bottom */
                    <div className="absolute inset-x-5 bottom-0 top-10 flex justify-center overflow-hidden pointer-events-none">
                      <div className="w-full max-w-[210px] h-full bg-[#181818] rounded-t-[28px] border-t-2 border-x-2 border-[#333333]/70 shadow-[0_-12px_32px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col pt-2.5 px-2">
                        {/* Phone Notch */}
                        <div className="w-12 h-1 bg-[#2C2C2C] rounded-full mx-auto mb-2 shrink-0" />
                        {/* Screen Area */}
                        <div className="flex-1 w-full rounded-t-[20px] overflow-hidden bg-black relative">
                          <img 
                            src={col.previewImage} 
                            alt={col.name} 
                            className="w-full h-full object-cover object-top select-none" 
                          />
                          {/* Bottom subtle gradient vignette */}
                          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Empty Cards Graphic (for Drafts / 0 items) */
                    <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                      <img 
                        src={workspaceEmptyScreen} 
                        alt="Empty collection preview" 
                        className="w-[125px] h-auto object-contain opacity-35" 
                      />
                    </div>
                  )}
                </div>

                {/* Below Card Details */}
                <div className="mt-3.5 flex items-start justify-between px-1">
                  <div>
                    <h3 className="text-white text-[15px] font-medium leading-tight group-hover:text-neutral-200 transition-colors">
                      {col.name}
                    </h3>
                    <p className="text-[#888888] text-[13px] mt-1 font-normal">
                      {col.itemText || (col.itemCount === 0 ? "No items" : `${col.itemCount} items`)}
                    </p>
                  </div>

                  {/* Member / Collaborator Overlapping Avatars */}
                  {col.members && col.members.length > 0 && (
                    <div className="flex items-center -space-x-1.5 shrink-0 pt-0.5">
                      {col.members.map((m, idx) => (
                        <div 
                          key={m.id || idx}
                          className={cn(
                            "w-[22px] h-[22px] rounded-full border border-[#0A0A0A] flex items-center justify-center text-[10px] font-semibold select-none shadow-sm",
                            m.bg
                          )}
                        >
                          {m.initial}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Collection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#141414] border border-[#2A2A2A] text-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">Create Collection</DialogTitle>
            <DialogDescription className="text-xs text-[#888888] mt-1">
              Create a new collection to organize boards and apps with your team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="collectionName" className="text-xs text-[#AAAAAA] mb-2 block font-normal">
              Collection Name
            </Label>
            <Input
              id="collectionName"
              placeholder="e.g. Mobile Inspiration"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateWorkspace();
                }
              }}
              className="bg-[#222222] border-[#333333] text-white rounded-lg h-[42px] px-3.5 text-sm focus:border-[#555] focus:outline-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              className="text-[#888] hover:text-white hover:bg-[#202020] text-xs h-[38px] rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleCreateWorkspace} 
              disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
              className="bg-white text-black hover:bg-neutral-200 text-xs font-medium h-[38px] px-4 rounded-lg disabled:opacity-50"
            >
              {isCreatingWorkspace ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Collection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Modal for unauthenticated visitors */}
      <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </main>
  );
}
