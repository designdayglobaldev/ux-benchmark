import { useDebounce } from '@/hooks/use-debounce';
import { useState, useEffect, type ChangeEvent } from 'react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { Plus, Waypoints, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TableSkeleton } from '@/components/ui/table-skeleton'

const route = getRouteApi('/_authenticated/flows/')

export function Flows() {
  const { filter = '' } = route.useSearch()
  const navigate = route.useNavigate()
  const [searchTerm, setSearchTerm] = useState(filter)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [flows, setFlows] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const fetchFlows = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/flows')
      if (!res.ok) throw new Error('Failed to fetch flows')
      const data = await res.json()
      setFlows(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFlows()
  }, [])

  const handleDeleteFlow = async (flowId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/flows/${flowId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setFlows(flows => flows.filter(f => f.id !== flowId))
      }
    } catch (error) {
      console.error('Failed to delete flow:', error)
    }
  }

  const filteredFlows = flows.filter((flow) =>
    flow.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  )

  useEffect(() => {
    if (typeof navigate === 'function') {
      navigate({ search: (prev: any) => ({ ...prev, filter: debouncedSearchTerm || undefined }) as any })
    }
  }, [debouncedSearchTerm, navigate])

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <>
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main fixed>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Flows</h1>
            <p className='text-muted-foreground'>
              Manage user journeys and grouped screen sequences.
            </p>
          </div>
          <Button asChild>
            <Link to='/flows/new'>
              <Plus className='mr-2 h-4 w-4' /> Create Flow
            </Link>
          </Button>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Search flows...'
              className='h-9 w-40 lg:w-62.5'
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <Separator className='shadow-sm' />

        {isLoading ? (
          <TableSkeleton columns={5} />
        ) : filteredFlows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center border rounded-lg border-dashed mt-4 bg-muted/10">
            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full mb-4">
              <Waypoints className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No flows found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {searchTerm 
                ? `No flows match the search "${searchTerm}". Try adjusting your filters.` 
                : "You haven't created any flows yet. Flows represent user journeys inside apps."}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link to='/flows/new'>
                  <Plus className='mr-2 h-4 w-4' /> Create Your First Flow
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className='border rounded-md mt-4 flex-1 overflow-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flow Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Screen Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFlows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((flow) => (
                    <TableRow 
                      key={flow.id} 
                      className='cursor-pointer hover:bg-muted/50'
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (!target.closest('button') && !target.closest('a')) {
                          navigate({ to: '/flows/$flowId', params: { flowId: flow.id } })
                        }
                      }}
                    >
                      <TableCell className='font-medium'>{flow.name}</TableCell>
                      <TableCell className='text-muted-foreground'>{flow.slug}</TableCell>
                      <TableCell className='text-muted-foreground'>{flow.screens?.length || 0} Screens</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            flow.status === 'LIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {flow.status}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className="flex justify-end gap-2">
                          <Button variant='ghost' size='sm' asChild>
                            <Link 
                              to='/flows/$flowId/edit' 
                              params={{ flowId: flow.id }}
                            >
                              Edit
                            </Link>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant='ghost' size='sm' className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the flow "{flow.name}" and remove its data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteFlow(flow.id); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredFlows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='h-24 text-center'>
                        No flows found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <div className='flex items-center justify-between px-2 py-4'>
              <div className='text-sm text-muted-foreground'>
                Showing {filteredFlows.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredFlows.length)} of {filteredFlows.length} entries
              </div>
              <div className='flex items-center space-x-2'>
                <Button 
                  variant='outline' 
                  size='sm' 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className='text-sm font-medium'>
                  Page {currentPage} of {Math.max(1, Math.ceil(filteredFlows.length / ITEMS_PER_PAGE))}
                </div>
                <Button 
                  variant='outline' 
                  size='sm' 
                  disabled={currentPage >= Math.ceil(filteredFlows.length / ITEMS_PER_PAGE) || filteredFlows.length === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Main>
    </>
  )
}
