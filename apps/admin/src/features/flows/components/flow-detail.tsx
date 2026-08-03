import { useDebounce } from '@/hooks/use-debounce';
import { useState, useEffect } from 'react'
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
import { DetailPageSkeleton } from '@/components/ui/detail-page-skeleton'

export function FlowDetail() {
  const routeApi = getRouteApi('/_authenticated/flows/$flowId/')
  const { flowId } = routeApi.useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [flow, setFlow] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/flows/${flowId}`)
        if (!res.ok) throw new Error('Failed to fetch flow')
        const data = await res.json()
        setFlow(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    if (flowId) fetchFlow()
  }, [flowId])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!flow) {
    return <div className="p-8 text-center text-muted-foreground">Flow not found</div>
  }

  const screens = flow.screens || []
  const filteredScreens = screens.filter((s: any) => 
    (s.app?.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
    (s.name || s.screenName || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  )

  return (
    <>
      <Header>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/flows'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <div className='flex items-center gap-2'>
            <h1 className='text-lg font-semibold'>{flow.name}</h1>
            <Badge variant={flow.status === 'LIVE' ? 'default' : 'secondary'}>{flow.status}</Badge>
          </div>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button variant='outline' asChild>
            <Link to='/flows/$flowId/edit' params={{ flowId: flow.id }}>
              <Edit className='mr-2 h-4 w-4' /> Edit Flow
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
              Apps and screens that currently use this flow.
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
                <TableHead>Sequence No.</TableHead>
                <TableHead className='text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScreens.map((screen: any) => (
                <TableRow key={screen.id} className='hover:bg-muted/50 transition-colors'>
                  <TableCell>{screen.app?.name || '-'}</TableCell>
                  <TableCell className='font-medium'>{screen.name || screen.screenName}</TableCell>
                  <TableCell>{screen.screenNo || screen.no || '-'}</TableCell>
                  <TableCell className='text-right'>
                    <Button variant='ghost' size='sm' asChild>
                      <Link to='/screens/$screenId' params={{ screenId: screen.id }}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredScreens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className='h-24 text-center'>
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
            Showing {filteredScreens.length > 0 ? 1 : 0} to {filteredScreens.length} of {filteredScreens.length} entries
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm' disabled>
              Previous
            </Button>
            <Button variant='outline' size='sm' className='bg-primary text-primary-foreground hover:bg-primary/90' disabled={filteredScreens.length === 0}>
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
