import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ImageDropzone } from '@/components/image-dropzone'
import { MultiSelect } from '@/components/multi-select'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Skeleton } from '@/components/ui/skeleton'
import { uploadAppImage } from '@/lib/supabase'
import { toast } from 'sonner'
import { screenSchema, type ScreenFormValues } from '../schemas'

export function ScreenForm({ screenId, initialAppId }: { screenId?: string; initialAppId?: string }) {
  const navigate = useNavigate()
  const [apps, setApps] = useState<any[]>([])
  const [flows, setFlows] = useState<any[]>([])
  const [uiElements, setUiElements] = useState<any[]>([])
  const [patterns, setPatterns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!screenId
  const [isFetchingData, setIsFetchingData] = useState(isEditing)
  
  const form = useForm<ScreenFormValues>({
    resolver: zodResolver(screenSchema) as any,
    defaultValues: {
      name: '',
      slug: '',
      appId: initialAppId || '',
      flowId: '',
      screenNo: '',
      imageUrl: '',
      uxAnalysis: '',
      tonalityAndContent: '',
      keyHighlights: '',
      evidenceWhoWhy: '',
      whereToUse: '',
      whereNotToUse: '',
      similarApps: [],
      status: 'DRAFT',
      uiElementIds: [],
      patternIds: [],
    },
  })

  const screenName = form.watch('name')

  useEffect(() => {
    if (!isEditing && screenName) {
      const generatedSlug = screenName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      form.setValue('slug', generatedSlug, { shouldValidate: true })
    }
  }, [screenName, form.setValue, isEditing])

  useEffect(() => {
    if (initialAppId && !isEditing && apps.length > 0) {
      form.setValue('appId', initialAppId)
    }
  }, [initialAppId, isEditing, apps, form.setValue])

  useEffect(() => {
    // Fetch options
    Promise.all([
      fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/apps').then(r => r.json()),
      fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/flows').then(r => r.json()),
      fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/ui-elements').then(r => r.json()),
      fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/patterns').then(r => r.json())
    ]).then(([appsData, flowsData, uiElemsData, patternsData]) => {
      setApps(appsData)
      setFlows(flowsData)
      setUiElements(uiElemsData)
      setPatterns(patternsData)
    })

    if (screenId) {
      setIsFetchingData(true)
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/screens/${screenId}`)
        .then(res => res.json())
        .then(data => {
          form.reset({
            name: data.name || '',
            slug: data.slug || '',
            appId: data.appId || '',
            flowId: data.flowId || '',
            screenNo: data.screenNo ? String(data.screenNo) : '',
            imageUrl: data.imageUrl || '',
            uxAnalysis: data.uxAnalysis || '',
            tonalityAndContent: data.tonalityAndContent || '',
            keyHighlights: data.keyHighlights || '',
            evidenceWhoWhy: data.evidenceWhoWhy || '',
            whereToUse: data.whereToUse || '',
            whereNotToUse: data.whereNotToUse || '',
            similarApps: data.similarApps || [],
            status: data.status || 'DRAFT',
            uiElementIds: data.uiElements?.map((u: any) => u.id) || [],
            patternIds: data.patterns?.map((p: any) => p.id) || [],
          })
          setIsFetchingData(false)
        })
        .catch(() => setIsFetchingData(false))
    }
  }, [screenId, form.reset])

  const onSubmit = async (data: ScreenFormValues) => {
    setIsLoading(true)
    try {
      let uploadedImageUrl = data.imageUrl

      if (data.imageUrl && typeof data.imageUrl !== 'string') {
        toast.loading('Uploading screen image...')
        uploadedImageUrl = await uploadAppImage(data.imageUrl as unknown as File, 'screens')
        toast.dismiss()
      }

      const payload = {
        ...data,
        imageUrl: uploadedImageUrl
      }

      const url = screenId 
        ? `${import.meta.env.VITE_API_URL || ''}/api/v1/screens/${screenId}`
        : (import.meta.env.VITE_API_URL || '') + '/api/v1/screens'
      
      const method = screenId ? 'PUT' : 'POST'
      
      toast.loading(screenId ? 'Updating screen...' : 'Saving screen...')
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to save screen')
      toast.dismiss()
      toast.success(screenId ? 'Screen updated successfully' : 'Screen saved successfully')
      navigate({ to: '/screens' })
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || 'Failed to save screen')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/screens'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <h1 className='text-lg font-semibold'>{screenId ? 'Edit Screen' : 'Upload New Screen'}</h1>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button variant='outline' onClick={() => {
            form.setValue('status', 'DRAFT')
            form.handleSubmit(onSubmit as any)()
          }} disabled={isLoading}>Save Draft</Button>
          <Button onClick={() => {
            form.setValue('status', 'LIVE')
            form.handleSubmit(onSubmit as any)()
          }} disabled={isLoading}>
            <Save className='mr-2 h-4 w-4' /> Publish Screen
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='max-w-4xl mx-auto'>
        {isFetchingData ? (
          <div className='grid gap-6'>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-[150px] w-full" />
                <div className="grid grid-cols-2 gap-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            
            <div className='flex items-center justify-between'>
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>

            <div className='space-y-6'>
              <Card>
                <CardContent className='grid gap-6 pt-6'>
                  <Skeleton className="h-[120px] w-full" />
                  <Separator />
                  <Skeleton className="h-[120px] w-full" />
                  <Separator />
                  <Skeleton className="h-[120px] w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className='grid gap-6 pt-6'>
                  <Skeleton className="h-[120px] w-full" />
                  <Separator />
                  <div className='grid grid-cols-2 gap-6'>
                    <Skeleton className="h-[120px] w-full" />
                    <Skeleton className="h-[120px] w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit as any)(e); }} className='grid gap-6'>
          
          <Card>
            <CardHeader>
              <CardTitle>Screen Details</CardTitle>
              <CardDescription>Basic information and image upload.</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6'>
              
              <div className='grid grid-cols-2 gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='name'>Screen Name</Label>
                  <Input id='name' {...form.register('name')} placeholder='e.g. Account Creation Step 1' />
                  {form.formState.errors.name && <span className="text-sm text-red-500">{form.formState.errors.name.message}</span>}
                </div>
                <div className='grid gap-3'>
                  <Label htmlFor='slug'>Slug</Label>
                  <Input id='slug' {...form.register('slug')} placeholder='e.g. account-creation-step-1' />
                  {form.formState.errors.slug && <span className="text-sm text-red-500">{form.formState.errors.slug.message}</span>}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='appName'>Associated App</Label>
                  <select id='appName' {...form.register('appId')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                    <option value=''>Select an App...</option>
                    {apps.map(app => (
                      <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                  </select>
                  {form.formState.errors.appId && <span className="text-sm text-red-500">{form.formState.errors.appId.message}</span>}
                </div>
                <div className='grid gap-3'>
                  <Label htmlFor='assignedFlow'>Assigned Flow</Label>
                  <select id='assignedFlow' {...form.register('flowId')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                    <option value=''>Select a Flow...</option>
                    {flows.map(flow => (
                      <option key={flow.id} value={flow.id}>{flow.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='grid gap-3'>
                <Controller
                  control={form.control}
                  name='imageUrl'
                  render={({ field }) => (
                    <div className='grid gap-3'>
                      <ImageDropzone label='Screen Image' value={field.value} onImageSelect={field.onChange} />
                      {form.formState.errors.imageUrl && <span className="text-sm text-red-500">{form.formState.errors.imageUrl.message as string}</span>}
                    </div>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='uiElements'>UI Elements</Label>
                  <Controller
                    control={form.control}
                    name='uiElementIds'
                    render={({ field }) => (
                      <MultiSelect
                        placeholder='Select UI elements...'
                        options={uiElements.map(el => ({ label: el.title, value: el.id }))}
                        selected={field.value || []}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div className='grid gap-3'>
                  <Label htmlFor='patterns'>UX Patterns</Label>
                  <Controller
                    control={form.control}
                    name='patternIds'
                    render={({ field }) => (
                      <MultiSelect
                        placeholder='Select UX patterns...'
                        options={patterns.map(pat => ({ label: pat.title, value: pat.id }))}
                        selected={field.value || []}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>

              <div className='grid gap-3'>
                <Label>Similar Apps</Label>
                <Controller
                  control={form.control}
                  name='similarApps'
                  render={({ field }) => (
                    <MultiSelect
                      placeholder='Select similar apps...'
                      options={apps.map(a => ({ label: a.name, value: a.name }))}
                      selected={field.value || []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fixed Analysis Blocks */}
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold'>Screen Analysis</h2>
              <p className='text-sm text-muted-foreground'>Provide detailed insights and context for this screen.</p>
            </div>
          </div>

          <div className='space-y-6'>
            <Card>
              <CardContent className='grid gap-6 pt-6'>
                <div className='grid gap-3'>
                  <Label className='text-xs uppercase font-semibold text-muted-foreground'>UX Analysis</Label>
                  <Controller
                    control={form.control}
                    name='uxAnalysis'
                    render={({ field }) => (
                      <RichTextEditor 
                        value={field.value || ''} 
                        onChange={field.onChange} 
                      />
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className='grid gap-3'>
                  <Label className='text-xs uppercase font-semibold text-muted-foreground'>Tonality & Content</Label>
                  <Controller
                    control={form.control}
                    name='tonalityAndContent'
                    render={({ field }) => (
                      <RichTextEditor 
                        value={field.value || ''} 
                        onChange={field.onChange} 
                      />
                    )}
                  />
                </div>

                <Separator />

                <div className='grid gap-3'>
                  <Label className='text-xs uppercase font-semibold text-muted-foreground'>Key Highlights & UX Principles</Label>
                  <Controller
                    control={form.control}
                    name='keyHighlights'
                    render={({ field }) => (
                      <RichTextEditor 
                        value={field.value || ''} 
                        onChange={field.onChange} 
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Usage & Evidence</CardTitle>
              </CardHeader>
              <CardContent className='grid gap-6'>
                <div className='grid gap-3'>
                  <Label className='text-xs uppercase font-semibold text-muted-foreground'>Evidence — Who & Why</Label>
                  <Controller
                    control={form.control}
                    name='evidenceWhoWhy'
                    render={({ field }) => (
                      <RichTextEditor 
                        value={field.value || ''} 
                        onChange={field.onChange} 
                      />
                    )}
                  />
                </div>

                <Separator />

                <div className='grid grid-cols-2 gap-6'>
                  <div className='grid gap-3'>
                    <Label className='text-xs uppercase font-semibold text-muted-foreground'>Where to use this</Label>
                    <Controller
                      control={form.control}
                      name='whereToUse'
                      render={({ field }) => (
                        <RichTextEditor 
                          value={field.value || ''} 
                          onChange={field.onChange} 
                        />
                      )}
                    />
                  </div>
                  <div className='grid gap-3'>
                    <Label className='text-xs uppercase font-semibold text-muted-foreground'>Where not to use this</Label>
                    <Controller
                      control={form.control}
                      name='whereNotToUse'
                      render={({ field }) => (
                        <RichTextEditor 
                          value={field.value || ''} 
                          onChange={field.onChange} 
                        />
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </form>
        )}
      </Main>
    </>
  )
}
