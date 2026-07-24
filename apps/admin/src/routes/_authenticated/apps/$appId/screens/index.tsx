import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Eye, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { ScreenCardSkeleton } from '@/components/ui/screen-card-skeleton'

export const Route = createFileRoute('/_authenticated/apps/$appId/screens/')({
  component: AppScreens,
})

function AppScreens() {
  const { appId } = Route.useParams()
  const [screens, setScreens] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`http://localhost:4000/api/v1/screens?appId=${appId}`)
      .then(res => res.json())
      .then(data => {
        setScreens(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }, [appId])

  const handleDeleteScreen = async (screenId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/screens/${screenId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setScreens(screens => screens.filter(s => s.id !== screenId))
      }
    } catch (error) {
      console.error('Failed to delete screen:', error)
    }
  }
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">App Screens</h2>
          <p className="text-muted-foreground">Manage and categorize screens specifically for this application.</p>
        </div>
        <Button asChild>
          <Link to="/screens/new" search={{ appId }}>
            <Plus className="mr-2 h-4 w-4" /> Upload Screen
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ScreenCardSkeleton key={i} />
          ))}
        </div>
      ) : screens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl border-dashed bg-muted/10">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Screens Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">This app doesn't have any screens associated with it yet. Upload a screen to get started.</p>
          <Button asChild>
            <Link to="/screens/new" search={{ appId }}>
              <Plus className="mr-2 h-4 w-4" /> Upload Screen
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {screens.map((screen) => (
            <Card key={screen.id} className="group overflow-hidden border shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col">
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
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <Button size="sm" variant="secondary" className="h-8 shadow-md" asChild>
                    <Link to={`/screens/${screen.id}`}>
                      <Eye className="w-4 h-4 mr-2" /> View
                    </Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="secondary" className="h-8 w-8 shadow-md text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the screen "{screen.name}" and remove its data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteScreen(screen.id); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <CardContent className="p-3 bg-card flex-1">
                <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors mb-2">
                  {screen.name}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {screen.patterns?.slice(0, 3).map((tag: any) => (
                    <Badge key={tag.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {tag.title}
                    </Badge>
                  ))}
                  {screen.uiElements?.slice(0, 3).map((tag: any) => (
                    <Badge key={tag.id} variant="outline" className="text-[10px] px-1.5 py-0">
                      {tag.title}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
