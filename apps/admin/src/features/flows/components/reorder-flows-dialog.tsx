import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface ReorderFlowsDialogProps {
  appId: string;
  flows: any[];
  onSuccess: () => void;
}

export function ReorderFlowsDialog({ appId, flows, onSuccess }: ReorderFlowsDialogProps) {
  const [open, setOpen] = useState(false);
  const [orderedFlows, setOrderedFlows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setOrderedFlows([...flows]);
    }
  }, [open, flows]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFlows = [...orderedFlows];
    const temp = newFlows[index - 1];
    newFlows[index - 1] = newFlows[index];
    newFlows[index] = temp;
    setOrderedFlows(newFlows);
  };

  const moveDown = (index: number) => {
    if (index === orderedFlows.length - 1) return;
    const newFlows = [...orderedFlows];
    const temp = newFlows[index + 1];
    newFlows[index + 1] = newFlows[index];
    newFlows[index] = temp;
    setOrderedFlows(newFlows);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    if (dragIndex === dropIndex) return;

    const newFlows = [...orderedFlows];
    const [draggedItem] = newFlows.splice(dragIndex, 1);
    newFlows.splice(dropIndex, 0, draggedItem);
    
    setOrderedFlows(newFlows);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/flows/app/${appId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowIds: orderedFlows.map(f => f.id) })
      });

      if (!response.ok) throw new Error('Failed to update sequence');
      
      toast.success('Flow sequence updated successfully');
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast.error('Failed to update sequence');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mr-2">
          <GripVertical className="mr-2 h-4 w-4" /> Reorder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reorder Flows</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 my-4 max-h-[60vh] overflow-y-auto pr-2">
          {orderedFlows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No flows to reorder.</p>
          ) : (
            orderedFlows.map((flow, index) => (
              <div 
                key={flow.id} 
                className="flex items-center justify-between p-3 border rounded-md bg-card cursor-move hover:border-primary/50 transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="flex items-center gap-3 truncate">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm truncate">{flow.name}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5" 
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                  >
                    <span className="text-xs">▲</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5" 
                    disabled={index === orderedFlows.length - 1}
                    onClick={() => moveDown(index)}
                  >
                    <span className="text-xs">▼</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || orderedFlows.length === 0}>
            {isSaving ? 'Saving...' : 'Save Sequence'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
