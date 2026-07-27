import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { patternSchema, type PatternFormValues } from '../schemas'
import { toast } from 'sonner'

export function PatternForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(false)
  const navigate = useNavigate()

  const params = useParams({ strict: false })
  const patternId = (params as any).patternId

  const isEditing = !!patternId

  const form = useForm<PatternFormValues>({
    resolver: zodResolver(patternSchema),
    defaultValues: {
      status: 'DRAFT',
      title: '',
      slug: '',
      content: ''
    }
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form

  useEffect(() => {
    if (patternId) {
      const fetchPattern = async () => {
        setIsFetchingData(true)
        try {
          const res = await fetch(`http://localhost:4000/api/v1/patterns/${patternId}`)
          if (!res.ok) throw new Error('Failed to fetch Pattern')
          const data = await res.json()
          
          reset({
            title: data.title || '',
            slug: data.slug || '',
            content: data.content || '',
            status: data.status || 'DRAFT'
          })
        } catch (error) {
          toast.error('Failed to load Pattern data')
          console.error(error)
        } finally {
          setIsFetchingData(false)
        }
      }
      fetchPattern()
    }
  }, [patternId, reset])

  const title = watch('title')

  useEffect(() => {
    if (!isEditing && title) {
      const generatedSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      setValue('slug', generatedSlug, { shouldValidate: true })
    }
  }, [title, setValue, isEditing])

  const onSubmit = async (data: PatternFormValues) => {
    try {
      setIsSubmitting(true)
      toast.loading(isEditing ? 'Updating Pattern...' : 'Saving Pattern...')
      
      const url = isEditing 
        ? `http://localhost:4000/api/v1/patterns/${patternId}`
        : 'http://localhost:4000/api/v1/patterns'

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Failed to ${isEditing ? 'update' : 'save'} Pattern`)
      }
      
      toast.dismiss()
      toast.success(isEditing ? 'Pattern updated successfully!' : 'Pattern published successfully!')
      navigate({ to: '/patterns' })
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'save'} Pattern`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const ErrorMessage = ({ name }: { name: keyof PatternFormValues }) => {
    const error = errors[name]
    if (!error) return null
    return <span className='text-xs text-destructive'>{error.message?.toString()}</span>
  }

  if (isFetchingData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Header>
        <div className='flex items-center gap-4'>
          <Button type='button' variant='ghost' size='icon' asChild>
            <Link to='/patterns'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <h1 className='text-lg font-semibold'>{isEditing ? 'Edit Pattern' : 'Create Pattern'}</h1>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button type='button' variant='outline'>Save Draft</Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />} 
            {isSubmitting ? 'Updating...' : (isEditing ? 'Update Pattern' : 'Publish Pattern')}
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='max-w-4xl mx-auto'>
        <div className='grid gap-6'>
          
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Reusable behavioral UX tags applied to screens (e.g., Progressive Disclosure, Gamification).</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6'>
              <div className='grid grid-cols-2 gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='title'>Pattern Title</Label>
                  <Input id='title' placeholder='e.g. Gamification, Paywall' {...register('title')} />
                  <ErrorMessage name='title' />
                </div>
                <div className='grid gap-3'>
                  <Label htmlFor='slug'>Slug (Auto-generated)</Label>
                  <Input id='slug' placeholder='e.g. gamification' readOnly className='bg-muted/50' {...register('slug')} />
                  <ErrorMessage name='slug' />
                </div>
              </div>

              <div className='grid gap-3'>
                <Label htmlFor='content'>Definition / Content</Label>
                <Textarea 
                  id='content' 
                  placeholder='Definition or notes about this UX pattern...'
                  className='min-h-[100px]'
                  {...register('content')}
                />
                <ErrorMessage name='content' />
              </div>

              <div className='grid gap-3'>
                <Label htmlFor='status'>Status</Label>
                <select id='status' {...register('status')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'>
                  <option value='DRAFT'>Draft</option>
                  <option value='LIVE'>Live</option>
                </select>
                <ErrorMessage name='status' />
              </div>

            </CardContent>
          </Card>

        </div>
      </Main>
    </form>
  )
}
