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
import { subcategorySchema, type SubcategoryFormValues } from '../schemas'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SubcategoryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const navigate = useNavigate()

  const params = useParams({ strict: false })
  const subcategoryId = (params as any).subcategoryId

  const isEditing = !!subcategoryId

  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      status: 'DRAFT',
      title: '',
      slug: '',
      description: ''
    }
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/categories')
        if (res.ok) {
          setCategories(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()

    if (subcategoryId) {
      const fetchSubcategory = async () => {
        setIsFetchingData(true)
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/subcategories/${subcategoryId}`)
          if (!res.ok) throw new Error('Failed to fetch subcategory')
          const data = await res.json()
          
          reset({
            title: data.title || '',
            slug: data.slug || '',
            description: data.description || '',
            status: data.status || 'DRAFT',
            categoryId: data.categoryId || ''
          })
        } catch (error) {
          toast.error('Failed to load subcategory data')
          console.error(error)
        } finally {
          setIsFetchingData(false)
        }
      }
      fetchSubcategory()
    }
  }, [subcategoryId, reset])

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

  const onSubmit = async (data: SubcategoryFormValues) => {
    try {
      setIsSubmitting(true)
      toast.loading(isEditing ? 'Updating subcategory...' : 'Saving subcategory...')
      
      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL || ''}/api/v1/subcategories/${subcategoryId}`
        : (import.meta.env.VITE_API_URL || '') + '/api/v1/subcategories'

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Failed to ${isEditing ? 'update' : 'save'} subcategory`)
      }
      
      toast.dismiss()
      toast.success(isEditing ? 'Subcategory updated successfully!' : 'Subcategory published successfully!')
      navigate({ to: '/subcategories' })
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'save'} subcategory`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const ErrorMessage = ({ name }: { name: keyof SubcategoryFormValues }) => {
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
            <Link to='/subcategories'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <h1 className='text-lg font-semibold'>{isEditing ? 'Edit Subcategory' : 'Create New Subcategory'}</h1>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button type='button' variant='outline'>Save Draft</Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />} 
            {isSubmitting ? 'Updating...' : (isEditing ? 'Update Subcategory' : 'Publish Subcategory')}
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
                  <Label htmlFor='title'>Subcategory Title</Label>
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
                <Label htmlFor='categoryId'>Parent Category</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("w-full justify-between font-normal", !watch('categoryId') && "text-muted-foreground")}
                    >
                      {watch('categoryId')
                        ? categories.find((cat) => cat.id === watch('categoryId'))?.title
                        : "Select a category..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((cat) => (
                            <CommandItem
                              value={cat.title}
                              key={cat.id}
                              onSelect={() => {
                                setValue('categoryId', cat.id, { shouldValidate: true })
                                // close popover automatically is handled by CommandItem by default usually, but if not we can add state.
                                // It's fine for now.
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  cat.id === watch('categoryId') ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {cat.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <ErrorMessage name='categoryId' />
              </div>

              <div className='grid gap-3'>
                <Label htmlFor='description'>Description</Label>
                <Textarea 
                  id='description' 
                  placeholder='Optional overview of the subcategory...'
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
