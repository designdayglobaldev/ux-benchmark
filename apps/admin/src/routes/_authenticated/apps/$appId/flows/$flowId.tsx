import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Settings2, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/apps/$appId/flows/$flowId')({
  component: AppFlowDetail,
})

function AppFlowDetail() {
  const { appId, flowId } = Route.useParams()
  const navigate = useNavigate()
  const [flow, setFlow] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isManageSequenceOpen, setIsManageSequenceOpen] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/flows/${flowId}?appId=${appId}`)
      .then(res => res.json())
      .then(data => {
        // Sort screens by screenNo if available, otherwise by createdAt
        if (data && data.screens) {
          data.screens.sort((a: any, b: any) => (a.screenNo || 0) - (b.screenNo || 0))

        }
        setFlow(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }, [flowId])

  const handleDeleteFlow = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/flows/${flowId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        navigate({ to: "/apps/$appId/flows", params: { appId } })
      }
    } catch (error) {
      console.error('Failed to delete flow:', error)
    }
  }

  const handleSaveSequence = (newScreens: any[]) => {
    setFlow({ ...flow, screens: newScreens })
    setIsManageSequenceOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading flow details...</p>
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Flow not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex w-full items-start border-b pb-6">
        <div className="flex flex-1 items-start gap-4">
          <Button variant="outline" size="icon" asChild className="shrink-0 mt-0.5">
            <Link to="/apps/$appId/flows" params={{ appId }}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold tracking-tight">{flow.name}</h2>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                flow.status === 'LIVE' ? 'bg-green-500/10 text-green-600' :
                flow.status === 'DRAFT' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' :
                'bg-yellow-500/10 text-yellow-600'
              }`}>
                {flow.status || 'DRAFT'}
              </span>
            </div>
            <p className="text-muted-foreground">Showing {flow.screens?.length || 0} screens in sequence.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 mt-0.5">
          <Button variant="secondary" onClick={() => setIsManageSequenceOpen(true)}>
            <Settings2 className="mr-2 w-4 h-4" /> Manage Sequence
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 w-4 h-4" /> Delete Flow
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the flow "{flow.name}" and remove its data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteFlow} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Horizontal Timeline */}
      <div className="relative">
        {/* Connection Line Behind Cards */}
        <div className="absolute top-[40%] left-0 right-0 h-1 bg-muted -z-10 rounded-full" />
        
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x pt-4 px-2">
          {flow.screens?.length > 0 ? flow.screens.map((screen: any, index: number) => (
            <div key={screen.id} className="flex-none w-64 snap-center relative">
              
              {/* Step Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground font-bold text-xs px-3 py-1 rounded-full shadow-md border-2 border-background">
                Step {screen.screenNo || index + 1}
              </div>

              <Card className="group overflow-hidden border shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col h-full bg-background mt-3">
                {/* Image Container */}
                <div className="relative w-full aspect-[3/4] bg-muted/20 border-b flex items-center justify-center overflow-hidden">
                  {screen.imageUrl ? (
                    <img 
                      src={screen.imageUrl} 
                      alt={screen.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">No Image</span>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <Button size="sm" variant="secondary" className="shadow-md" asChild>
                      <Link to={`/screens/$screenId`} params={{ screenId: screen.id }}>
                        View Screen
                      </Link>
                    </Button>
                  </div>
                </div>

                <CardContent className="p-3 bg-card text-center">
                  <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {screen.name}
                  </h3>
                </CardContent>
              </Card>

              {/* Next Step Arrow (Except for last item) */}
              {index < flow.screens.length - 1 && (
                <div className="absolute -right-5 top-[40%] bg-background p-1 rounded-full border shadow-sm z-10 translate-x-1/2 -translate-y-1/2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          )) : (
            <div className="py-20 flex w-full justify-center text-muted-foreground text-sm">
              No screens have been added to this flow yet.
            </div>
          )}
        </div>
      </div>

      {/* Manage Sequence Modal */}
      {isManageSequenceOpen && (
        <ManageSequenceModal 
          open={isManageSequenceOpen}
          onOpenChange={setIsManageSequenceOpen}
          initialScreens={flow.screens || []}
          flowId={flowId}
          onSave={handleSaveSequence}
        />
      )}

    </div>
  )
}

function ManageSequenceModal({ open, onOpenChange, initialScreens, flowId, onSave }: any) {
  const [orderedScreens, setOrderedScreens] = useState<any[]>(() => {
    const screens = [...initialScreens]
    screens.sort((a: any, b: any) => (a.screenNo || 0) - (b.screenNo || 0))
    return screens
  })
  const [isSavingSequence, setIsSavingSequence] = useState(false)
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)
  const [draggedOverItemIndex, setDraggedOverItemIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index)
  }

  const handleDragEnter = (index: number) => {
    setDraggedOverItemIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (index: number) => {
    if (draggedItemIndex === null) return
    if (draggedItemIndex === index) {
      setDraggedItemIndex(null)
      setDraggedOverItemIndex(null)
      return
    }

    const newScreens = [...orderedScreens]
    const draggedItem = newScreens[draggedItemIndex]
    newScreens.splice(draggedItemIndex, 1)
    newScreens.splice(index, 0, draggedItem)
    
    setOrderedScreens(newScreens)
    setDraggedItemIndex(null)
    setDraggedOverItemIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedItemIndex(null)
    setDraggedOverItemIndex(null)
  }

  const handleSaveSequence = async () => {
    setIsSavingSequence(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/flows/${flowId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenIds: orderedScreens.map(s => s.id)
        })
      })
      
      if (!res.ok) throw new Error('Failed to update sequence')
      
      toast.success('Sequence updated successfully')
      onSave(orderedScreens)
    } catch (error) {
      toast.error('Failed to update sequence')
      console.error(error)
    } finally {
      setIsSavingSequence(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Screen Sequence</DialogTitle>
          <DialogDescription>
            Reorder the screens in this flow by moving them up or down.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto py-2">
          {orderedScreens.map((screen, index) => (
            <div 
              key={screen.id} 
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-3 border rounded-md bg-card cursor-grab active:cursor-grabbing transition-colors ${
                draggedItemIndex === index ? 'opacity-40' : ''
              } ${
                draggedOverItemIndex === index && draggedItemIndex !== index ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab shrink-0" />
                <div className="bg-muted w-8 h-12 rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
                  {screen.imageUrl ? (
                    <img 
                      src={screen.imageUrl} 
                      alt={screen.name} 
                      className="w-full h-full object-cover pointer-events-none" 
                      loading="lazy" 
                      decoding="async" 
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No img</span>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-sm truncate">{screen.name}</span>
                  <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                </div>
              </div>
            </div>
          ))}
          {orderedScreens.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No screens to sequence.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveSequence} disabled={isSavingSequence}>
            {isSavingSequence ? 'Saving...' : 'Save Sequence'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
