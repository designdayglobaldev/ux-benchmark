import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  const appId = form.watch('appId')
  const flowId = form.watch('flowId')
  const screenNo = form.watch('screenNo')

  useEffect(() => {
    if (!isEditing && appId && flowId) {
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/screens?appId=${appId}`)
        .then(res => res.json())
        .then(data => {
          const screensInFlow = data.filter((s: any) => s.flowId === flowId)
          form.setValue('screenNo', String(screensInFlow.length + 1), { shouldValidate: true })
        })
        .catch(console.error)
    }
  }, [appId, flowId, isEditing, form.setValue])

  useEffect(() => {
    if (!isEditing) {
      const appName = apps.find(a => a.id === appId)?.name || ''
      const flowName = flows.find(f => f.id === flowId)?.name || ''
      const parts = [appName, flowName, screenNo].filter(Boolean)
      
      if (parts.length > 0) {
        form.setValue('name', parts.join(' '), { shouldValidate: true })
      }
    }
  }, [appId, flowId, screenNo, apps, flows, form.setValue, isEditing])

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

  const handleGenerateAIData = async () => {
    let imageUrl = form.getValues('imageUrl');
    if (!imageUrl) {
      toast.error('Please upload an image first');
      return;
    }

    setIsLoading(true);
    toast.loading('Analyzing UI with AI...');

    try {
      let base64Data = imageUrl;

      // If imageUrl is a File object, convert it to base64
      if (typeof imageUrl !== 'string' && imageUrl instanceof File) {
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageUrl as unknown as Blob);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/ai/generate-screen-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: base64Data,
          appId: form.getValues('appId') || undefined
        })
      });

      if (!res.ok) throw new Error('Failed to generate AI data');
      
      const data = await res.json();
      
      // Auto-fill fields (omitting name so it follows our specific pattern)
      if (data.uxAnalysis) form.setValue('uxAnalysis', data.uxAnalysis);
      if (data.tonalityAndContent) form.setValue('tonalityAndContent', data.tonalityAndContent);
      if (data.keyHighlights) form.setValue('keyHighlights', data.keyHighlights);
      if (data.evidenceWhoWhy) form.setValue('evidenceWhoWhy', data.evidenceWhoWhy);
      if (data.whereToUse) form.setValue('whereToUse', data.whereToUse);
      if (data.whereNotToUse) form.setValue('whereNotToUse', data.whereNotToUse);
      if (data.uiElementIds && Array.isArray(data.uiElementIds)) form.setValue('uiElementIds', data.uiElementIds);
      if (data.patternIds && Array.isArray(data.patternIds)) form.setValue('patternIds', data.patternIds);

      toast.dismiss();
      toast.success('AI data generated successfully!');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to generate AI data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

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
                  <Controller
                    control={form.control}
                    name="appId"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal text-left px-3",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? apps.find((app) => app.id === field.value)?.name
                              : "Select an App..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search apps..." />
                            <CommandList>
                              <CommandEmpty>No app found.</CommandEmpty>
                              <CommandGroup>
                                {apps.map((app) => (
                                  <CommandItem
                                    value={app.name}
                                    key={app.id}
                                    onSelect={() => {
                                      form.setValue("appId", app.id)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        app.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {app.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {form.formState.errors.appId && <span className="text-sm text-red-500">{form.formState.errors.appId.message}</span>}
                </div>
                <div className='grid gap-3'>
                  <Label htmlFor='assignedFlow'>Assigned Flow</Label>
                  <Controller
                    control={form.control}
                    name="flowId"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal text-left px-3",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? flows.find((flow) => flow.id === field.value)?.name
                              : "Select a Flow..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search flows..." />
                            <CommandList>
                              <CommandEmpty>No flow found.</CommandEmpty>
                              <CommandGroup>
                                {flows.map((flow) => (
                                  <CommandItem
                                    value={flow.name}
                                    key={flow.id}
                                    onSelect={() => {
                                      form.setValue("flowId", flow.id)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        flow.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {flow.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
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
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold'>Screen Analysis</h2>
              <p className='text-sm text-muted-foreground'>Provide detailed insights and context for this screen.</p>
            </div>
            <Button 
              type="button" 
              variant="secondary" 
              className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20"
              onClick={handleGenerateAIData}
              disabled={isLoading || !form.watch('imageUrl')}
            >
              ✨ Auto-Fill with AI
            </Button>
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
