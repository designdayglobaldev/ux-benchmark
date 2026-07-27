import { getRouteApi, Link, Outlet, useLocation } from '@tanstack/react-router'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'

// Using mock data for scaffolding
const MOCK_APP = {
  id: 'revolut',
  name: 'Revolut',
  status: 'Live',
  isStaffPick: true,
}

export function AppDetailLayout() {
  const routeApi = getRouteApi('/_authenticated/apps/$appId')
  const { appId } = routeApi.useParams()
  const location = useLocation()
  
  // In a real app, we would fetch the data using appId
  const app = MOCK_APP
  
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
            <h1 className='text-lg font-semibold'>{app.name}</h1>
            <Badge variant={app.status === 'Live' ? 'default' : 'secondary'}>{app.status}</Badge>
            {app.isStaffPick && <Badge variant='secondary' className='bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'>Staff Pick</Badge>}
          </div>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button variant='outline' asChild>
            <Link to='/apps/new'>
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
