import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";

interface SaveToBoardButtonProps {
    screenId: string;
}

export function SaveToBoardButton({ screenId }: SaveToBoardButtonProps) {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (!isOpen || !user) return;
        const fetchWorkspaces = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                const res = await fetch(`${apiUrl}/api/v1/workspaces/user/${user.id}`);
                const data = await res.json();
                setWorkspaces(data);
            } catch (error) {
                console.error("Failed to fetch workspaces", error);
            }
        };
        fetchWorkspaces();
    }, [isOpen, user]);

    const handleSaveToBoard = async (boardId: string) => {
        if (!user) return;
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            await fetch(`${apiUrl}/api/v1/boards/${boardId}/screens`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ screenId, userId: user.id }),
            });
            setIsOpen(false);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (error) {
            console.error("Failed to save to board", error);
        }
    };

    const handleQuickCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim() || !user || isCreating) return;
        setIsCreating(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            let workspaceId = workspaces[0]?.id;
            
            // If no workspace exists, create a default one first
            if (!workspaceId) {
                const wsRes = await fetch(`${apiUrl}/api/v1/workspaces`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "Personal Workspace", ownerId: user.id }),
                });
                const ws = await wsRes.json();
                workspaceId = ws.id;
            }

            // Create the board
            const boardRes = await fetch(`${apiUrl}/api/v1/boards`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newBoardName, workspaceId }),
            });
            const board = await boardRes.json();

            // Save screen to the new board
            await handleSaveToBoard(board.id);
            setNewBoardName("");
        } catch (error) {
            console.error("Failed to quick create board", error);
        } finally {
            setIsCreating(false);
        }
    };

    if (!user) return null;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button 
                    disabled={isSaved}
                    className={`flex items-center justify-center gap-[4px] w-[170px] h-[40px] px-4 rounded-[20px] border border-[#323232] transition-colors font-['Inter'] text-[14px] font-medium whitespace-nowrap ${isSaved ? 'bg-green-600/20 text-green-400 border-green-600/50' : 'bg-transparent text-white hover:bg-white/5'}`}
                >
                    {isSaved ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Saved!
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            Save to Board
                        </>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-[#161616] border-[#333] text-white p-2">
                <h4 className="font-medium text-sm px-2 mb-2">Save to...</h4>
                
                <form onSubmit={handleQuickCreate} className="px-2 pb-3 mb-2 border-b border-[#333] flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Create new board..." 
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        className="flex-1 bg-[#222] border border-[#444] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#666]"
                    />
                    <Button type="submit" disabled={!newBoardName.trim() || isCreating} size="sm" className="h-[26px] bg-white text-black hover:bg-gray-200 px-2 text-xs">
                        Create
                    </Button>
                </form>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {workspaces.map((ws) => (
                        <div key={ws.id}>
                            <div className="text-[10px] font-semibold text-gray-500 px-2 py-1 uppercase tracking-wider">{ws.name}</div>
                            {ws.boards?.map((board: any) => (
                                <button
                                    key={board.id}
                                    onClick={() => handleSaveToBoard(board.id)}
                                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-[#333] rounded flex items-center justify-between group"
                                >
                                    <span>{board.name}</span>
                                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                            {ws.boards?.length === 0 && (
                                <div className="px-2 text-xs text-gray-500 italic">No boards</div>
                            )}
                        </div>
                    ))}
                    {workspaces.length === 0 && (
                        <div className="px-2 text-xs text-gray-400">No workspaces found.</div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
