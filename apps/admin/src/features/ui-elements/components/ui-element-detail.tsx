import { useState } from 'react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'


// Mock Data
const MOCK_UI_ELEMENT = {
  id: 'ui-1',
  title: 'Progress Bar',
  status: 'LIVE',
  screens: [
    { id: 'scr-1', appName: 'Revolut', screenName: 'Registration Step 2' },
    { id: 'scr-5', appName: 'Monzo', screenName: 'Identity Verification' },
  ]
}

export function UiElementDetail() {
  const routeApi = getRouteApi('/_authenticated/ui-elements/$elementId/')
  routeApi.useParams()
  const [searchTerm, setSearchTerm] = useState('')

  const element = MOCK_UI_ELEMENT

  const filteredScreens = element.screens.filter(s => 
    s.appName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.screenName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <Header>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/ui-elements'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <div className='flex items-center gap-2'>
            <h1 className='text-lg font-semibold'>{element.title}</h1>
            <Badge variant={element.status === 'LIVE' ? 'default' : 'secondary'}>{element.status}</Badge>
          </div>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button variant='outline' asChild>
            <Link to='/ui-elements/$elementId/edit' params={{ elementId: element.id }}>
              <Edit className='mr-2 h-4 w-4' /> Edit UI Element
            </Link>
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Associated Screens</h1>
            <p className='text-muted-foreground'>
              Screens that currently use this UI element.
            </p>
          </div>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Search screens...'
              className='h-9 w-40 lg:w-62.5'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Separator className='shadow-sm' />

        <div className='border rounded-md mt-4'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App Name</TableHead>
                <TableHead>Screen Name</TableHead>
                <TableHead className='text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScreens.map((screen) => (
                <TableRow key={screen.id} className='hover:bg-muted/50 transition-colors'>
                  <TableCell>{screen.appName}</TableCell>
                  <TableCell className='font-medium'>{screen.screenName}</TableCell>
                  <TableCell className='text-right'>
                    <Button variant='ghost' size='sm' asChild>
                      <Link to='/screens/$screenId' params={{ screenId: screen.id }}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredScreens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className='h-24 text-center'>
                    No screens found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className='flex items-center justify-between px-2 py-4'>
          <div className='text-sm text-muted-foreground'>
            Showing 1 to {filteredScreens.length} of {filteredScreens.length} entries
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm' disabled>
              Previous
            </Button>
            <Button variant='outline' size='sm' className='bg-primary text-primary-foreground hover:bg-primary/90'>
              1
            </Button>
            <Button variant='outline' size='sm' disabled>
              Next
            </Button>
          </div>
        </div>
      </Main>
    </>
  )
}
