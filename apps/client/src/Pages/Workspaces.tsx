import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function Workspaces() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false);

  const fetchWorkspaces = async () => {
    if (!user) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/workspaces/user/${user.id}`);
      const data = await res.json();
      setWorkspaces(data);
    } catch (error) {
      console.error("Failed to fetch workspaces", error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !user) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/api/v1/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName, ownerId: user.id }),
      });
      setIsDialogOpen(false);
      setNewWorkspaceName("");
      fetchWorkspaces();
    } catch (error) {
      console.error("Failed to create workspace", error);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || !activeWorkspaceId) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/api/v1/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName, workspaceId: activeWorkspaceId }),
      });
      setIsBoardDialogOpen(false);
      setNewBoardName("");
      fetchWorkspaces();
    } catch (error) {
      console.error("Failed to create board", error);
    }
  };

  if (!user) {
    return <div className="flex-1 w-full bg-black text-white flex items-center justify-center">Please login to view Workspaces</div>;
  }

  return (
    <main className="flex-1 w-full bg-black flex flex-col px-4 sm:px-[30px] pt-10 pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-[#EAEAEA]">Team Workspaces</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-gray-200">Create Workspace</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#161616] border-[#333] text-white">
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new workspace to collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="col-span-3 bg-[#0a0a0a] border-[#333] text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateWorkspace} className="bg-white text-black hover:bg-gray-200">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-10">
        {workspaces.map((ws) => (
          <div key={ws.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-[#EAEAEA]">{ws.name}</h2>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#333] text-black bg-white hover:bg-gray-200"
                onClick={() => {
                  setActiveWorkspaceId(ws.id);
                  setIsBoardDialogOpen(true);
                }}
              >
                + New Board
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {ws.boards?.map((board: any) => (
                <Card 
                  key={board.id} 
                  className="bg-[#161616] border-[#333] cursor-pointer hover:border-[#555] transition-colors"
                  onClick={() => navigate(`/boards/${board.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-white">{board.name}</CardTitle>
                    <CardDescription className="text-gray-400">Shared Board</CardDescription>
                  </CardHeader>
                </Card>
              ))}
              {ws.boards?.length === 0 && (
                <div className="text-gray-500 text-sm">No boards yet. Create one!</div>
              )}
            </div>
          </div>
        ))}
        {workspaces.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            You don't have any workspaces yet.
          </div>
        )}
      </div>

      <Dialog open={isBoardDialogOpen} onOpenChange={setIsBoardDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#161616] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle>Create Shared Board</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new board to save screens and discuss with your team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="boardName" className="text-right">Board Name</Label>
              <Input
                id="boardName"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className="col-span-3 bg-[#0a0a0a] border-[#333] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateBoard} className="bg-white text-black hover:bg-gray-200">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
