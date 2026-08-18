import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, ArrowRight, Layers, Clock, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { FlowCardSkeleton } from '@/components/ui/flow-card-skeleton'

import { ReorderFlowsDialog } from '@/features/flows/components/reorder-flows-dialog'

export const Route = createFileRoute('/_authenticated/apps/$appId/flows/')({
  component: AppFlows,
})

function AppFlows() {
  const { appId } = Route.useParams()
  const [flows, setFlows] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFlows = () => {
    setIsLoading(true)
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/flows?appId=${appId}`)
      .then(res => res.json())
      .then(data => {
        setFlows(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchFlows()
  }, [appId])
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">App Flows</h2>
          <p className="text-muted-foreground">Manage flows specifically for this application.</p>
        </div>
        <div className="flex items-center">
          {flows.length > 1 && (
            <ReorderFlowsDialog appId={appId} flows={flows} onSuccess={fetchFlows} />
          )}
          <Button asChild>
            <Link to="/flows/new" search={{ appId }}>
              <Plus className="mr-2 h-4 w-4" /> Create Flow
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <FlowCardSkeleton key={i} />
          ))}
        </div>
      ) : flows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl border-dashed bg-muted/10">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Share2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Flows Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">This app doesn't have any flows associated with it yet. Create a flow to get started.</p>
          <Button asChild>
            <Link to="/flows/new" search={{ appId }}>
              <Plus className="mr-2 h-4 w-4" /> Create Flow
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {flows.map((flow) => (
            <Card key={flow.id} className="group overflow-hidden border transition-all hover:shadow-md hover:border-primary/50 cursor-pointer flex flex-col">
              <div className="relative h-32 bg-muted/30 p-4 flex items-center justify-center border-b overflow-hidden">
                {/* Abstract Representation of a Flow */}
                <div className="flex items-center justify-center space-x-4 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-10 h-16 rounded-sm border bg-background shadow-sm" />
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="w-10 h-16 rounded-sm border bg-background shadow-sm translate-y-2" />
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="w-10 h-16 rounded-sm border bg-background shadow-sm" />
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    flow.status === 'LIVE' ? 'bg-green-500/10 text-green-600' :
                    flow.status === 'DRAFT' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' :
                    'bg-yellow-500/10 text-yellow-600'
                  }`}>
                    {flow.status || 'DRAFT'}
                  </span>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-lg line-clamp-1 mb-1 group-hover:text-primary transition-colors">{flow.name}</h3>
                <div className="flex items-center text-xs text-muted-foreground space-x-4 mt-3">
                  <span className="flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1.5" />
                    {flow.screens?.length || 0} screens
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {new Date(flow.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-0">
                <Link 
                  to="/apps/$appId/flows/$flowId" params={{ appId, flowId: flow.id }}
                  className="w-full flex items-center justify-center p-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border-t transition-colors"
                >
                  View Flow Details <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
