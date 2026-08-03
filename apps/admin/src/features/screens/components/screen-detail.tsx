import { useState, useEffect } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
import { ScreenDetailSkeleton } from '@/components/ui/screen-detail-skeleton'

export function ScreenDetail() {
  const routeApi = getRouteApi('/_authenticated/screens/$screenId')
  const { screenId } = routeApi.useParams()
  const navigate = useNavigate()

  const [screen, setScreen] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'UX ANALYSIS': true,
    'TONALITY & CONTENT': true,
    'KEY HIGHLIGHTS & UX PRINCIPLES': true,
    'EVIDENCE — WHO & WHY': true,
    'WHERE TO USE': true
  })

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/screens/${screenId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch screen details')
        return res.json()
      })
      .then(data => {
        setScreen(data)
      })
      .catch(error => console.error(error))
      .finally(() => setIsLoading(false))
  }, [screenId])

  const handleDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/screens/${screenId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        navigate({ to: '/screens' })
      }
    } catch (error) {
      console.error('Failed to delete screen:', error)
    }
  }

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }))
  }

  if (isLoading) {
    return <ScreenDetailSkeleton />
  }

  if (!screen) {
    return <div className="flex h-screen items-center justify-center">Screen not found</div>
  }

  // Construct dynamic sections from db fields
  const dynamicSections = []
  if (screen.uxAnalysis) {
    dynamicSections.push({ id: 'ux', title: 'UX ANALYSIS', content: screen.uxAnalysis })
  }
  if (screen.tonalityAndContent) {
    dynamicSections.push({ id: 'tone', title: 'TONALITY & CONTENT', content: screen.tonalityAndContent })
  }
  if (screen.keyHighlights) {
    dynamicSections.push({ id: 'highlights', title: 'KEY HIGHLIGHTS & UX PRINCIPLES', content: screen.keyHighlights })
  }
  if (screen.evidenceWhoWhy) {
    dynamicSections.push({ id: 'evidence', title: 'EVIDENCE — WHO & WHY', tags: screen.similarApps, content: screen.evidenceWhoWhy })
  }
  if (screen.whereToUse || screen.whereNotToUse) {
    let content = ''
    if (screen.whereToUse) content += `<strong>Where to Use:</strong><br/>${screen.whereToUse}<br/><br/>`
    if (screen.whereNotToUse) content += `<strong>Where Not to Use:</strong><br/>${screen.whereNotToUse}`
    dynamicSections.push({ id: 'wheretouse', title: 'WHERE TO USE', content: content })
  }

  return (
    <div className='flex h-screen w-full bg-background text-foreground overflow-hidden font-sans absolute inset-0 z-50'>
      
      {/* Left Column: Analysis (320px) */}
      <div className='w-[360px] flex-shrink-0 border-r bg-background flex flex-col'>
        <div className='p-4 border-b flex items-center justify-between'>
          <Button variant='ghost' size='sm' asChild className='text-muted-foreground hover:text-foreground'>
            <Link to='/screens'>
              <ArrowLeft className='mr-2 h-4 w-4' /> Back to Library
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='ghost' size='icon' className='text-muted-foreground hover:text-destructive hover:bg-destructive/10'>
                <Trash2 className='h-4 w-4' />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the screen "{screen?.name}" and remove its data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className='flex-1 overflow-y-auto custom-scrollbar'>
          <div className='p-6 space-y-8'>
            {dynamicSections.map(section => (
              <Collapsible
                key={section.id}
                open={openSections[section.title]}
                onOpenChange={() => toggleSection(section.title)}
              >
                <CollapsibleTrigger className='flex w-full items-center justify-between text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-3 hover:text-foreground transition-colors'>
                  {section.title}
                  {openSections[section.title] ? <ChevronUp className='h-3 w-3' /> : <ChevronDown className='h-3 w-3' />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {section.tags && section.tags.length > 0 && (
                    <div className='flex gap-2 mb-3 flex-wrap'>
                      {section.tags.map((tag: string) => (
                        <span key={tag} className='px-2 py-1 bg-muted text-foreground text-xs rounded-md border'>{tag}</span>
                      ))}
                    </div>
                  )}
                  <div 
                    className='text-[13px] leading-relaxed text-foreground/80 font-normal prose prose-sm dark:prose-invert max-w-none'
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </CollapsibleContent>
              </Collapsible>
            ))}
            {dynamicSections.length === 0 && (
              <div className="text-sm text-muted-foreground">No analysis content available for this screen.</div>
            )}
          </div>
        </div>
      </div>

      {/* Center Column: Interactive Preview */}
      <div className='flex-1 flex flex-col bg-muted/30 relative'>
        <div className='absolute left-4 top-1/2 -translate-y-1/2 z-10'>
          <Button variant='outline' size='icon' className='h-12 w-12 rounded-full shadow-sm bg-background' disabled>
            <ChevronLeft className='h-6 w-6' />
          </Button>
        </div>
        <div className='absolute right-4 top-1/2 -translate-y-1/2 z-10'>
          <Button variant='outline' size='icon' className='h-12 w-12 rounded-full shadow-sm bg-background' disabled>
            <ChevronRight className='h-6 w-6' />
          </Button>
        </div>
        
        <div className='flex-1 flex items-center justify-center p-8'>
          <div className='relative w-full max-w-[340px] aspect-[9/19] rounded-[40px] border-[4px] border-black overflow-hidden shadow-2xl bg-white flex items-center justify-center'>
            {screen.imageUrl ? (
              <img 
                src={screen.imageUrl} 
                alt={screen.name}
                className='w-full h-full object-cover' 
              />
            ) : (
              <span className="text-muted-foreground">No Image Available</span>
            )}
          </div>
        </div>

        <div className='h-16 flex items-center justify-center gap-2 pb-4'>
          <div className='w-4 h-1.5 rounded-full bg-primary'></div>
          <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground/30'></div>
          <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground/30'></div>
        </div>
      </div>

      {/* Right Column: Metadata (320px) */}
      <div className='w-[360px] flex-shrink-0 border-l bg-background h-full overflow-y-auto custom-scrollbar'>
        <div className='p-8 space-y-10'>
          
          {/* Header Info */}
          <div>
            <div className='text-[11px] font-medium text-muted-foreground mb-2 flex items-center gap-1'>
              {screen.app?.appLogo ? (
                 <img src={screen.app.appLogo} alt={screen.app.name} className="w-4 h-4 rounded-full" />
              ) : null}
              {screen.app?.name || 'Unassigned App'}
            </div>
            <h1 className='text-xl font-semibold text-foreground mb-3'>
              {screen.name}
            </h1>
            <p className='text-[13px] text-muted-foreground leading-relaxed'>
              {screen.slug}
            </p>
          </div>

          <div className='w-full h-px bg-border'></div>

          {/* UI Elements */}
          <div>
            <h3 className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3'>UI Elements</h3>
            {screen.uiElements && screen.uiElements.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {screen.uiElements.map((el: any) => (
                  <span key={el.id} className='px-3 py-1.5 bg-muted hover:bg-muted/80 cursor-pointer text-foreground text-[12px] rounded-md border transition-colors'>{el.title}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">None assigned</p>
            )}
          </div>

          <div className='w-full h-px bg-border'></div>

          {/* Patterns */}
          <div>
            <h3 className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3'>Patterns</h3>
            {screen.patterns && screen.patterns.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {screen.patterns.map((pat: any) => (
                  <span key={pat.id} className='px-3 py-1.5 bg-muted hover:bg-muted/80 cursor-pointer text-foreground text-[12px] rounded-md border transition-colors'>{pat.title}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">None assigned</p>
            )}
          </div>

          <div className='w-full h-px bg-border'></div>

          {/* Flow */}
          <div>
            <h3 className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3'>Flow</h3>
            {screen.flow ? (
              <div className='flex flex-wrap gap-2'>
                <span className='px-3 py-1.5 bg-muted hover:bg-muted/80 cursor-pointer text-foreground text-[12px] rounded-md border transition-colors'>{screen.flow.name}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Not part of a flow</p>
            )}
          </div>

          {/* Flow Position */}
          {screen.flow && screen.screenNo && (
            <div>
              <h3 className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2'>Flow Position</h3>
              <div className='text-2xl font-light text-foreground mb-1'>
                {screen.screenNo.toString().padStart(2, '0')}
              </div>
              <div className='text-[11px] text-muted-foreground'>
                Screen {screen.screenNo} in {screen.flow.name}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
