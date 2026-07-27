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
import { categorySchema, type CategoryFormValues } from '../schemas'
import { toast } from 'sonner'

export function CategoryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(false)
  const navigate = useNavigate()

  const params = useParams({ strict: false })
  const categoryId = (params as any).categoryId

  const isEditing = !!categoryId

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      status: 'DRAFT',
      title: '',
      slug: '',
      description: ''
    }
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form

  useEffect(() => {
    if (categoryId) {
      const fetchCategory = async () => {
        setIsFetchingData(true)
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/categories/${categoryId}`)
          if (!res.ok) throw new Error('Failed to fetch category')
          const data = await res.json()
          
          reset({
            title: data.title || '',
            slug: data.slug || '',
            description: data.description || '',
            status: data.status || 'DRAFT'
          })
        } catch (error) {
          toast.error('Failed to load category data')
          console.error(error)
        } finally {
          setIsFetchingData(false)
        }
      }
      fetchCategory()
    }
  }, [categoryId, reset])

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

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setIsSubmitting(true)
      toast.loading(isEditing ? 'Updating category...' : 'Saving category...')
      
      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL || ''}/api/v1/categories/${categoryId}`
        : (import.meta.env.VITE_API_URL || '') + '/api/v1/categories'

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Failed to ${isEditing ? 'update' : 'save'} category`)
      }
      
      toast.dismiss()
      toast.success(isEditing ? 'Category updated successfully!' : 'Category published successfully!')
      navigate({ to: '/categories' })
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'save'} category`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const ErrorMessage = ({ name }: { name: keyof CategoryFormValues }) => {
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
            <Link to='/categories'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <h1 className='text-lg font-semibold'>{isEditing ? 'Edit Category' : 'Create New Category'}</h1>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button type='button' variant='outline'>Save Draft</Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />} 
            {isSubmitting ? 'Updating...' : (isEditing ? 'Update Category' : 'Publish Category')}
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='max-w-4xl mx-auto'>
        <div className='grid gap-6'>
          
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Broad classifications used to organize the catalog of applications.</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6'>
              <div className='grid grid-cols-2 gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='title'>Category Title</Label>
                  <Input id='title' placeholder='e.g. Finance, Productivity' {...register('title')} />
                  <ErrorMessage name='title' />
                </div>
                <div className='grid gap-3'>
                  <Label htmlFor='slug'>Slug (Auto-generated)</Label>
                  <Input id='slug' placeholder='e.g. finance' readOnly className='bg-muted/50' {...register('slug')} />
                  <ErrorMessage name='slug' />
                </div>
              </div>

              <div className='grid gap-3'>
                <Label htmlFor='description'>Description</Label>
                <Textarea 
                  id='description' 
                  placeholder='Optional overview of the category...'
                  className='min-h-[100px]'
                  {...register('description')}
                />
                <ErrorMessage name='description' />
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
