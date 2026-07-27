import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageDropzone } from '@/components/image-dropzone'
import { MultiSelect } from '@/components/multi-select'
import { ColorPaletteInput } from '@/components/color-palette-input'
import { TagInput } from '@/components/tag-input'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appSchema, type AppFormValues } from '../schemas'
import { uploadAppImage } from '@/lib/supabase'
import { toast } from 'sonner'

export function AppForm() {
  const [activeTab, setActiveTab] = useState('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [isFetchingData, setIsFetchingData] = useState(false)
  const navigate = useNavigate()

  // Use strict: false so this component can be used in both /new and /$appId/edit routes
  const params = useParams({ strict: false })
  const appId = (params as any).appId

  const isEditing = !!appId

  const form = useForm<AppFormValues>({
    resolver: zodResolver(appSchema) as any,
    defaultValues: {
      status: 'DRAFT' as const,
      isStaffPick: false,
      platform: [],
      market: [],
      palette: [],
      lookAndFeelTags: [],
      easeOfUseTags: [],
      contentClarityTags: [],
      trustTags: [],
      accessibilityTags: [],
      takeawayTags: [],
    }
  })

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = form

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/v1/categories')
        const data = await res.json()
        setCategories(data)
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (appId) {
      const fetchApp = async () => {
        setIsFetchingData(true)
        try {
          const res = await fetch(`http://localhost:4000/api/v1/apps/${appId}`)
          if (!res.ok) throw new Error('Failed to fetch app')
          const data = await res.json()
          
          // Populate the form with existing data
          reset({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            categoryId: data.categoryId || '',
            sourceUrl: data.sourceUrl || '',
            status: data.status || 'DRAFT',
            isStaffPick: data.isStaffPick || false,
            platform: data.platform || [],
            market: data.market || [],
            palette: data.palette || [],
            targetAudience: data.targetAudience || '',
            appLogo: data.appLogo || '',
            appThumbnail: data.appThumbnail || '',
            visualUiTypography: data.visualUiTypography || '',
            visualUiShape: data.visualUiShape || '',
            visualUiImagery: data.visualUiImagery || '',
            experienceUxSolves: data.experienceUxSolves || '',
            experienceUxOverall: data.experienceUxOverall || '',
            experienceUxTone: data.experienceUxTone || '',
            lookAndFeelText: data.lookAndFeelText || '',
            lookAndFeelTags: data.lookAndFeelTags || [],
            easeOfUseText: data.easeOfUseText || '',
            easeOfUseTags: data.easeOfUseTags || [],
            contentClarityText: data.contentClarityText || '',
            contentClarityTags: data.contentClarityTags || [],
            trustText: data.trustText || '',
            trustTags: data.trustTags || [],
            accessibilityText: data.accessibilityText || '',
            accessibilityTags: data.accessibilityTags || [],
            takeawayText: data.takeawayText || '',
            takeawayTags: data.takeawayTags || [],
          })
        } catch (error) {
          toast.error('Failed to load app data')
          console.error(error)
        } finally {
          setIsFetchingData(false)
        }
      }
      fetchApp()
    }
  }, [appId, reset])

  const appName = watch('name')

  useEffect(() => {
    // Only auto-generate slug if we are creating a new app, or if they explicitly change the name while editing.
    // Wait, if we use reset(data), the name changes, triggering this. So let's only auto-generate if we aren't fetching data.
    if (!isEditing && appName) {
      const generatedSlug = appName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      setValue('slug', generatedSlug, { shouldValidate: true })
    }
  }, [appName, setValue, isEditing])

  const onSubmit = async (data: AppFormValues) => {
    try {
      setIsSubmitting(true)
      
      let logoUrl = data.appLogo
      let thumbnailUrl = data.appThumbnail

      // Only upload if it's a File/Blob (new upload) - assume string means it's an existing URL
      if (data.appLogo && typeof data.appLogo !== 'string') {
        toast.loading('Uploading logo...')
        logoUrl = await uploadAppImage(data.appLogo as unknown as File, 'logos')
      }
      
      if (data.appThumbnail && typeof data.appThumbnail !== 'string') {
        toast.loading('Uploading thumbnail...')
        thumbnailUrl = await uploadAppImage(data.appThumbnail as unknown as File, 'thumbnails')
      }

      toast.loading(isEditing ? 'Updating app...' : 'Saving app...')
      
      const payload = {
        ...data,
        appLogo: logoUrl || 'https://via.placeholder.com/150', // Fallback
        appThumbnail: thumbnailUrl || 'https://via.placeholder.com/600x400',
      }
      
      const url = isEditing 
        ? `http://localhost:4000/api/v1/apps/${appId}`
        : 'http://localhost:4000/api/v1/apps'

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Failed to ${isEditing ? 'update' : 'save'} app`)
      }
      
      toast.dismiss()
      toast.success(isEditing ? 'App updated successfully!' : 'App published successfully!')
      navigate({ to: '/apps' })
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'save'} app`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to show errors
  const ErrorMessage = ({ name }: { name: keyof AppFormValues }) => {
    const error = errors[name]
    if (!error) return null
    return <span className='text-xs text-destructive'>{error.message?.toString()}</span>
  }

  const onInvalid = (formErrors: any) => {
    console.error('Validation errors:', formErrors)
    toast.error('Please check the form for errors before saving.')
    // If the error is on a different tab, we could switch to it, but a toast is a good start.
  }

  if (isFetchingData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit as any, onInvalid)(e); }}>
      <Header>
        <div className='flex items-center gap-4'>
          <Button type='button' variant='ghost' size='icon' asChild>
            <Link to='/apps'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <h1 className='text-lg font-semibold'>Create New App</h1>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button type='button' variant='outline'>Save Draft</Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />} 
            {isSubmitting ? 'Publishing...' : 'Publish'}
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='max-w-4xl mx-auto'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-2 mb-8'>
            <TabsTrigger value='basic'>Basic Information</TabsTrigger>
            <TabsTrigger value='deep-dive'>Deep Dive Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value='basic' className='space-y-6'>
            <div className='grid gap-6 p-6 border rounded-lg bg-card text-card-foreground shadow-sm'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label className='text-base'>Staff Pick Badge</Label>
                  <p className='text-sm text-muted-foreground'>
                    Highlight this app as an editor's choice.
                  </p>
                </div>
                <Controller
                  control={control}
                  name='isStaffPick'
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className='flex items-center justify-between pt-4 border-t'>
                <div className='space-y-0.5'>
                  <Label className='text-base'>Status</Label>
                  <p className='text-sm text-muted-foreground'>
                    Choose whether this app is LIVE or a DRAFT.
                  </p>
                </div>
                <div className='grid gap-1'>
                  <select id='status' {...register('status')} className='flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'>
                    <option value='DRAFT'>Draft</option>
                    <option value='LIVE'>Live</option>
                  </select>
                  <ErrorMessage name='status' />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-6 pt-4 border-t'>
                <div className='grid gap-3'>
                  <Label htmlFor='name'>App Name</Label>
                  <Input id='name' placeholder='e.g. Revolut' {...register('name')} />
                  <ErrorMessage name='name' />
                </div>
                <div className='grid gap-3'>
                  <Label htmlFor='slug'>Slug</Label>
                  <Input id='slug' placeholder='e.g. revolut' {...register('slug')} />
                  <ErrorMessage name='slug' />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='category'>Category</Label>
                  <select {...register('categoryId')} id='category' className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'>
                    <option value=''>Select Category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                  </select>
                  <ErrorMessage name='categoryId' />
                </div>
                <div className='grid gap-3'>
                  <Label htmlFor='sourceUrl'>Source URL</Label>
                  <Input id='sourceUrl' placeholder='e.g. /products/revolut' {...register('sourceUrl')} />
                  <ErrorMessage name='sourceUrl' />
                </div>
              </div>

              <div className='grid gap-3'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  placeholder='A dark, precise money super-app...'
                  className='min-h-[100px]'
                  {...register('description')}
                />
                <ErrorMessage name='description' />
              </div>

              <div className='grid grid-cols-2 gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='platform'>Platform</Label>
                  <Controller
                    control={control}
                    name='platform'
                    render={({ field }) => (
                      <MultiSelect
                        placeholder='Select platforms...'
                        options={[
                          { label: 'iOS', value: 'ios' },
                          { label: 'Android', value: 'android' },
                          { label: 'Web Page', value: 'webpage' },
                          { label: 'Web App', value: 'webapp' },
                          { label: 'Cross Platform', value: 'crossplatform' },
                        ]}
                        selected={field.value || []}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <ErrorMessage name='platform' />
                </div>
                <div className='grid gap-3'>
                  <Label>Brand Palette (Hex Codes)</Label>
                  <Controller
                    control={control}
                    name='palette'
                    render={({ field }) => (
                      <ColorPaletteInput colors={field.value || []} onChange={field.onChange} />
                    )}
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='market'>Market <span className='text-muted-foreground text-xs font-normal'>(Optional)</span></Label>
                  <Controller
                    control={control}
                    name='market'
                    render={({ field }) => (
                      <MultiSelect
                        placeholder='Select markets...'
                        options={[
                          { label: 'Worldwide', value: 'worldwide' },
                          { label: 'US & Canada', value: 'us-canada' },
                          { label: 'Europe', value: 'europe' },
                          { label: 'Asia', value: 'asia' },
                          { label: 'Latin America', value: 'latin-america' },
                        ]}
                        selected={field.value || []}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div className='grid gap-3'>
                  <Label htmlFor='targetAudience'>Target Audience <span className='text-muted-foreground text-xs font-normal'>(Optional)</span></Label>
                  <Input id='targetAudience' placeholder='e.g. Busy urban, Students' {...register('targetAudience')} />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-6'>
                <Controller
                  control={control}
                  name='appLogo'
                  render={({ field }) => (
                    <div className='grid gap-3'>
                      <ImageDropzone label='App Logo' value={field.value} onImageSelect={field.onChange} />
                      <ErrorMessage name='appLogo' />
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name='appThumbnail'
                  render={({ field }) => (
                    <div className='grid gap-3'>
                      <ImageDropzone label='App Thumbnail Image' value={field.value} onImageSelect={field.onChange} />
                      <ErrorMessage name='appThumbnail' />
                    </div>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value='deep-dive' className='space-y-6'>
            <div className='grid gap-6'>
              
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Visuals - UI</CardTitle>
                  <CardDescription>Breakdown of the visual design language.</CardDescription>
                </CardHeader>
                <CardContent className='grid gap-6'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='grid gap-2'>
                      <Label className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>Typography</Label>
                      <Textarea placeholder='e.g. Clean geometric sans...' className='bg-muted/50 min-h-[80px]' {...register('visualUiTypography')} />
                    </div>
                    <div className='grid gap-2'>
                      <Label className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>Shape</Label>
                      <Textarea placeholder='e.g. Soft-rounded cards...' className='bg-muted/50 min-h-[80px]' {...register('visualUiShape')} />
                    </div>
                    <div className='grid gap-2'>
                      <Label className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>Imagery</Label>
                      <Textarea placeholder='e.g. Data-forward...' className='bg-muted/50 min-h-[80px]' {...register('visualUiImagery')} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Experience - UX</CardTitle>
                  <CardDescription>Core product experience and problem solving.</CardDescription>
                </CardHeader>
                <CardContent className='grid gap-6'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='grid gap-2'>
                      <Label className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>What it solves</Label>
                      <Textarea placeholder='e.g. Solves borderless money...' className='bg-muted/50 min-h-[80px]' {...register('experienceUxSolves')} />
                    </div>
                    <div className='grid gap-2'>
                      <Label className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>Overall experience</Label>
                      <Textarea placeholder='e.g. Hub-and-tile control panel...' className='bg-muted/50 min-h-[80px]' {...register('experienceUxOverall')} />
                    </div>
                    <div className='grid gap-2'>
                      <Label className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>Tone</Label>
                      <Textarea placeholder='e.g. Confident, crisp...' className='bg-muted/50 min-h-[80px]' {...register('experienceUxTone')} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Look & Feel</CardTitle>
                </CardHeader>
                <CardContent className='grid gap-6'>
                  <div className='grid gap-2'>
                    <Label>Tags</Label>
                    <Controller
                      control={control}
                      name='lookAndFeelTags'
                      render={({ field }) => (
                        <TagInput tags={field.value || []} onChange={field.onChange} placeholder='e.g. Dark & sleek...' />
                      )}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label>Description</Label>
                    <Textarea placeholder='A near-black canvas...' className='bg-muted/50 min-h-[80px]' {...register('lookAndFeelText')} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Ease of Use</CardTitle>
                </CardHeader>
                <CardContent className='grid gap-6'>
                  <div className='grid gap-2'>
                    <Label>Tags</Label>
                    <Controller
                      control={control}
                      name='easeOfUseTags'
                      render={({ field }) => (
                        <TagInput tags={field.value || []} onChange={field.onChange} placeholder='e.g. Tab bar navigation...' />
                      )}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label>Description</Label>
                    <Textarea placeholder='A massive list of features packed into tab navigation...' className='bg-muted/50 min-h-[80px]' {...register('easeOfUseText')} />
                  </div>
                </CardContent>
              </Card>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Content & Clarity</CardTitle>
                  </CardHeader>
                  <CardContent className='grid gap-6'>
                    <div className='grid gap-2'>
                      <Label>Tags</Label>
                      <Controller
                        control={control}
                        name='contentClarityTags'
                        render={({ field }) => (
                          <TagInput tags={field.value || []} onChange={field.onChange} placeholder='e.g. Direct, Number-heavy...' />
                        )}
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label>Description</Label>
                      <Textarea placeholder='Copy is short, numbers are highly legible...' className='bg-muted/50 min-h-[80px]' {...register('contentClarityText')} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Trust</CardTitle>
                  </CardHeader>
                  <CardContent className='grid gap-6'>
                    <div className='grid gap-2'>
                      <Label>Tags</Label>
                      <Controller
                        control={control}
                        name='trustTags'
                        render={({ field }) => (
                          <TagInput tags={field.value || []} onChange={field.onChange} placeholder='e.g. Bank-grade...' />
                        )}
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label>Description</Label>
                      <Textarea placeholder='Real-time status notifications...' className='bg-muted/50 min-h-[80px]' {...register('trustText')} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Accessibility</CardTitle>
                </CardHeader>
                <CardContent className='grid gap-6'>
                  <div className='grid gap-2'>
                    <Label>Tags</Label>
                    <Controller
                      control={control}
                      name='accessibilityTags'
                      render={({ field }) => (
                        <TagInput tags={field.value || []} onChange={field.onChange} placeholder='e.g. High contrast...' />
                      )}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label>Description</Label>
                    <Textarea placeholder='Excellent contrast ratios...' className='bg-muted/50 min-h-[80px]' {...register('accessibilityText')} />
                  </div>
                </CardContent>
              </Card>

              <Card className='border-primary/20 bg-primary/5'>
                <CardHeader>
                  <CardTitle className='text-lg'>Takeaway</CardTitle>
                  <CardDescription>The final verdict on this app's UX.</CardDescription>
                </CardHeader>
                <CardContent className='grid gap-6'>
                  <div className='grid gap-2'>
                    <Label>Tags</Label>
                    <Controller
                      control={control}
                      name='takeawayTags'
                      render={({ field }) => (
                        <TagInput tags={field.value || []} onChange={field.onChange} placeholder='e.g. Clean, Efficient...' />
                      )}
                    />
                  </div>
                  <Textarea
                    placeholder='Revolut proves that massive utility can be packed into a terminal-like interface...'
                    className='min-h-[120px] bg-background'
                    {...register('takeawayText')}
                  />
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </form>
  )
}
