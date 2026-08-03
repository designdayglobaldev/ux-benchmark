import { useState, useEffect } from 'react'
import { getRouteApi, Link, Outlet, useLocation } from '@tanstack/react-router'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'

export function AppDetailLayout() {
  const routeApi = getRouteApi('/_authenticated/apps/$appId')
  const { appId } = routeApi.useParams()
  const location = useLocation()
  
  const [app, setApp] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/apps/${appId}`)
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
  
  return (
    <>
      <Header>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/apps'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <div className='flex items-center gap-2'>
            {isLoading ? (
              <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
            ) : app ? (
              <>
                <h1 className='text-lg font-semibold'>{app.name}</h1>
                <Badge variant={app.status === 'Live' ? 'default' : 'secondary'}>{app.status || 'Draft'}</Badge>
                {app.isStaffPick && <Badge variant='secondary' className='bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'>Staff Pick</Badge>}
              </>
            ) : (
              <h1 className='text-lg font-semibold'>Not Found</h1>
            )}
          </div>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button variant='outline' asChild disabled={isLoading || !app}>
            <Link to="/apps/$appId/edit" params={{ appId }}>
              <Edit className='mr-2 h-4 w-4' /> Edit App
            </Link>
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      <div className='border-b px-6 pt-4'>
        <div className='max-w-6xl mx-auto flex space-x-6'>
          <Link 
            to="/apps/$appId"
            params={{ appId }} 
            className={`pb-3 font-medium text-sm transition-colors border-b-2 ${location.pathname === `/apps/${appId}` ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Overview
          </Link>
          <Link 
            to="/apps/$appId/flows"
            params={{ appId }} 
            className={`pb-3 font-medium text-sm transition-colors border-b-2 ${location.pathname.includes('/flows') ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Flows
          </Link>
          <Link 
            to="/apps/$appId/screens"
            params={{ appId }} 
            className={`pb-3 font-medium text-sm transition-colors border-b-2 ${location.pathname.includes('/screens') ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Screens
          </Link>
        </div>
      </div>

      <Main className='w-full max-w-6xl mx-auto space-y-8'>
        <Outlet />
      </Main>
    </>
  )
}
