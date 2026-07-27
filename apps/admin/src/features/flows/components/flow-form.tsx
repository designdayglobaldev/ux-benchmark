import { useState, useEffect } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
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
import { flowSchema, type FlowFormValues } from '../schemas'
import { toast } from 'sonner'

export function FlowForm() {
  const routeApi = getRouteApi('/_authenticated/flows/$flowId/edit')
  // We might be on the 'new' route which doesn't have $flowId
  let flowId: string | undefined
  try {
    const params = routeApi.useParams()
    flowId = params.flowId
  } catch (e) {
    // Expected when on /flows/new
  }

  const navigate = useNavigate()
  const [isFetchingData, setIsFetchingData] = useState(!!flowId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FlowFormValues>({
    resolver: zodResolver(flowSchema) as any,
    defaultValues: {
      status: 'DRAFT',
    }
  })

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = form

  const nameValue = watch('name')

  useEffect(() => {
    if (nameValue && !flowId && !form.formState.dirtyFields.slug) {
      setValue('slug', nameValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''), { shouldValidate: true })
    }
  }, [nameValue, flowId, setValue, form.formState.dirtyFields.slug])

  useEffect(() => {
    if (flowId) {
      const fetchFlow = async () => {
        setIsFetchingData(true)
        try {
          const res = await fetch(`http://localhost:4000/api/v1/flows/${flowId}`)
          if (!res.ok) throw new Error('Failed to fetch flow')
          const data = await res.json()
          
          reset({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            status: data.status || 'DRAFT',
          })
        } catch (error) {
          console.error(error)
          toast.error('Failed to load flow data')
        } finally {
          setIsFetchingData(false)
        }
      }
      fetchFlow()
    }
  }, [flowId, reset])

  const onSubmit = async (data: FlowFormValues) => {
    setIsSubmitting(true)
    try {
      const url = flowId 
        ? `http://localhost:4000/api/v1/flows/${flowId}` 
        : 'http://localhost:4000/api/v1/flows'
      const method = flowId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to save flow')
      
      toast.success(flowId ? 'Flow updated successfully!' : 'Flow created successfully!')
      navigate({ to: '/flows' })
    } catch (error) {
      console.error(error)
      toast.error('Failed to save flow. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const ErrorMessage = ({ name }: { name: keyof FlowFormValues }) => {
    const error = errors[name]
    if (!error) return null
    return <span className='text-xs text-destructive'>{error.message?.toString()}</span>
  }

  const onInvalid = (formErrors: any) => {
    console.error('Validation errors:', formErrors)
    toast.error('Please check the form for errors before saving.')
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
            <Link to='/flows'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <h1 className='text-lg font-semibold'>{flowId ? 'Edit Flow' : 'Create New Flow'}</h1>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button 
            type='button' 
            variant='outline' 
            onClick={() => {
              setValue('status', 'DRAFT')
              handleSubmit(onSubmit as any, onInvalid)()
            }}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className='mr-2 h-4 w-4' /> Publish Flow
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='max-w-4xl mx-auto'>
        <div className='grid gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>Flow Details</CardTitle>
              <CardDescription>Basic information for the user journey.</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6'>
              
              <div className='grid grid-cols-2 gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='name'>Flow Name</Label>
                  <Input id='name' placeholder='e.g. Account Creation' {...register('name')} />
                  <ErrorMessage name='name' />
                </div>
                
                <div className='grid gap-3'>
                  <Label htmlFor='slug'>Slug</Label>
                  <Input id='slug' placeholder='e.g. account-creation' {...register('slug')} />
                  <ErrorMessage name='slug' />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='status'>Status</Label>
                  <select id='status' {...register('status')} className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                    <option value='DRAFT'>Draft</option>
                    <option value='LIVE'>Live</option>
                  </select>
                  <ErrorMessage name='status' />
                </div>
              </div>

              <div className='grid gap-3'>
                <Label htmlFor='description'>Description</Label>
                <Textarea id='description' placeholder='Describe what this flow is about...' className='min-h-[100px]' {...register('description')} />
                <ErrorMessage name='description' />
              </div>

            </CardContent>
          </Card>
        </div>
      </Main>
    </form>
  )
}
