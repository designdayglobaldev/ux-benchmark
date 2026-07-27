import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AppOverviewSkeleton } from '@/components/ui/app-overview-skeleton'

export function AppOverview() {
  const params = useParams({ strict: false }) as any
  const appId = params.appId
  
  const [app, setApp] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/apps/${appId}`)
        if (!res.ok) throw new Error('Failed to fetch app')
        const data = await res.json()
        setApp(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    if (appId) fetchApp()
  }, [appId])

  if (isLoading) {
    return <AppOverviewSkeleton />
  }

  if (!app) {
    return <div className="text-center py-12 text-muted-foreground">App not found.</div>
  }

  const DeepDiveSection = ({ title, tags, text }: { title: string, tags: string[], text: string }) => {
    if ((!tags || tags.length === 0) && !text) return null
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>{title}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {tags && tags.length > 0 && (
            <div className='flex gap-2 flex-wrap mb-2'>
              {tags.map((t: string) => (
                <Badge key={t} variant='secondary' className='text-xs'>{t}</Badge>
              ))}
            </div>
          )}
          {text && (
            <p className='text-sm text-muted-foreground leading-relaxed'>
              {text}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-10 max-w-5xl mx-auto'>
      {/* Header Section */}
      <div className='flex gap-6 items-start'>
        <div className='w-24 h-24 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0 border shadow-sm overflow-hidden'>
          {app.appLogo ? (
            <img src={app.appLogo} alt={app.name} className='w-full h-full object-cover' />
          ) : (
            <span className='text-3xl font-bold text-muted-foreground'>{app.name?.charAt(0)}</span>
          )}
        </div>
        <div className='space-y-3 flex-1 pt-1'>
          <div className='flex gap-2 flex-wrap items-center'>
            {app.category && <Badge variant='default' className='rounded-md'>{app.category.title}</Badge>}
            {(app.platform || []).map((p: string) => (
              <Badge key={p} variant='outline' className='rounded-md bg-background'>{p}</Badge>
            ))}
            {(app.market || []).map((m: string) => (
              <Badge key={m} variant='secondary' className='rounded-md'>{m}</Badge>
            ))}
          </div>
          <p className={`text-base leading-relaxed max-w-3xl ${app.description ? 'text-foreground' : 'text-muted-foreground italic'}`}>
            {app.description || 'No description provided for this application.'}
          </p>
          <div className='flex gap-4 items-center pt-1'>
            {app.sourceUrl && (
              <Button variant='outline' size='sm' asChild className='h-8'>
                <a href={app.sourceUrl} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='mr-2 h-3.5 w-3.5' /> View Source
                </a>
              </Button>
            )}
          </div>
        </div>
        
        {app.palette && app.palette.length > 0 && (
          <Card className='w-full md:w-64 flex-shrink-0'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm text-muted-foreground uppercase'>Brand Palette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex gap-2 flex-wrap'>
                {app.palette.map((hex: string) => (
                  <div 
                    key={hex} 
                    className='w-10 h-10 rounded-full border shadow-sm' 
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Deep Dive Section */}
      <div>
        <h2 className='text-xl font-bold mb-4 flex items-center gap-2'>
          Core Analysis
        </h2>
        
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8'>
          
          <Card className='bg-muted/30 border-dashed'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base text-foreground/80'>Visuals & UI</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <dl className='grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-4'>
                <div className='sm:col-span-3'>
                  <dt className='text-xs font-semibold uppercase text-muted-foreground mb-1'>Typography</dt>
                  <dd className={`text-sm ${app.visualUiTypography ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {app.visualUiTypography || 'Not specified'}
                  </dd>
                </div>
                <div className='sm:col-span-3'>
                  <dt className='text-xs font-semibold uppercase text-muted-foreground mb-1'>Shape & Form</dt>
                  <dd className={`text-sm ${app.visualUiShape ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {app.visualUiShape || 'Not specified'}
                  </dd>
                </div>
                <div className='sm:col-span-3'>
                  <dt className='text-xs font-semibold uppercase text-muted-foreground mb-1'>Imagery</dt>
                  <dd className={`text-sm ${app.visualUiImagery ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {app.visualUiImagery || 'Not specified'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className='bg-muted/30 border-dashed'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base text-foreground/80'>Experience & UX</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <dl className='grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-4'>
                <div className='sm:col-span-3'>
                  <dt className='text-xs font-semibold uppercase text-muted-foreground mb-1'>What it solves</dt>
                  <dd className={`text-sm ${app.experienceUxSolves ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {app.experienceUxSolves || 'Not specified'}
                  </dd>
                </div>
                <div className='sm:col-span-3'>
                  <dt className='text-xs font-semibold uppercase text-muted-foreground mb-1'>Overall Experience</dt>
                  <dd className={`text-sm ${app.experienceUxOverall ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {app.experienceUxOverall || 'Not specified'}
                  </dd>
                </div>
                <div className='sm:col-span-3'>
                  <dt className='text-xs font-semibold uppercase text-muted-foreground mb-1'>Tone of Voice</dt>
                  <dd className={`text-sm ${app.experienceUxTone ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {app.experienceUxTone || 'Not specified'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
        </div>

        {/* Dynamic Sections based on Tags and Text */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <DeepDiveSection 
            title="Look & Feel" 
            tags={app.lookAndFeelTags} 
            text={app.lookAndFeelText} 
          />
          <DeepDiveSection 
            title="Ease of Use" 
            tags={app.easeOfUseTags} 
            text={app.easeOfUseText} 
          />
          <DeepDiveSection 
            title="Content & Clarity" 
            tags={app.contentClarityTags} 
            text={app.contentClarityText} 
          />
          <DeepDiveSection 
            title="Trust & Security" 
            tags={app.trustTags} 
            text={app.trustText} 
          />
          <DeepDiveSection 
            title="Accessibility" 
            tags={app.accessibilityTags} 
            text={app.accessibilityText} 
          />
          <DeepDiveSection 
            title="Key Takeaway" 
            tags={app.takeawayTags} 
            text={app.takeawayText} 
          />
        </div>

      </div>
    </div>
  )
}
