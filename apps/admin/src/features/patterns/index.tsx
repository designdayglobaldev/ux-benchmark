import { useState, useEffect, type ChangeEvent } from 'react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { Plus, Compass, Trash2 } from 'lucide-react'
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
import { MigrateOrDeleteDialog } from '@/components/migrate-or-delete-dialog'
import { TableSkeleton } from '@/components/ui/table-skeleton'

const route = getRouteApi('/_authenticated/patterns/')

export function Patterns() {
  const { filter = '' } = route.useSearch() as any
  const navigate = route.useNavigate()
  const [searchTerm, setSearchTerm] = useState(filter)
  const [patterns, setPatterns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/v1/patterns')
        if (!res.ok) throw new Error('Failed to fetch patterns')
        const data = await res.json()
        setPatterns(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPatterns()
  }, [])

  const filteredPatterns = patterns.filter((pattern) =>
    pattern.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
    navigate({
      search: (prev: any) => ({
        ...prev,
        filter: e.target.value || undefined,
      }),
    })
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [patternToDelete, setPatternToDelete] = useState<any>(null)

  const openDeleteDialog = (pattern: any) => {
    setPatternToDelete(pattern)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!patternToDelete) return
    const res = await fetch(`http://localhost:4000/api/v1/patterns/${patternToDelete.id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setPatterns(patterns.filter(p => p.id !== patternToDelete.id))
    } else {
      throw new Error('Failed to delete')
    }
  }

  const handleMigrate = async (targetId: string) => {
    if (!patternToDelete) return
    const res = await fetch(`http://localhost:4000/api/v1/patterns/${patternToDelete.id}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    })
    if (res.ok) {
      setPatterns(patterns.filter(p => p.id !== patternToDelete.id))
    } else {
      throw new Error('Failed to migrate and delete')
    }
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
            <h1 className='text-2xl font-bold tracking-tight'>Patterns</h1>
            <p className='text-muted-foreground'>
              Reusable behavioral UX tags applied to screens (e.g., Gamification).
            </p>
          </div>
          <Button asChild>
            <Link to='/patterns/new'>
              <Plus className='mr-2 h-4 w-4' /> Create Pattern
            </Link>
          </Button>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Search UX patterns...'
              className='h-9 w-40 lg:w-62.5'
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <Separator className='shadow-sm' />

        {isLoading ? (
          <TableSkeleton columns={5} />
        ) : filteredPatterns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center border rounded-lg border-dashed mt-4 bg-muted/10">
            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full mb-4">
              <Compass className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No patterns found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {searchTerm 
                ? `No patterns match the search "${searchTerm}". Try adjusting your filters.` 
                : "You haven't created any UX patterns yet. Patterns help you tag behavioral components."}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link to='/patterns/new'>
                  <Plus className='mr-2 h-4 w-4' /> Create Your First Pattern
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
                    <TableHead>Pattern Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Screen Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatterns.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((pat) => (
                    <TableRow 
                      key={pat.id} 
                      className='cursor-pointer hover:bg-muted/50'
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (!target.closest('button') && !target.closest('a')) {
                          navigate({ to: '/patterns/$patternId', params: { patternId: pat.id } })
                        }
                      }}
                    >
                      <TableCell className='font-medium'>{pat.title}</TableCell>
                      <TableCell className='text-muted-foreground'>{pat.slug}</TableCell>
                      <TableCell>{pat.screens?.length || 0} Screens</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            pat.status === 'LIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {pat.status}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className="flex justify-end gap-2">
                          <Button variant='ghost' size='sm' asChild>
                            <Link 
                              to='/patterns/$patternId/edit' 
                              params={{ patternId: pat.id }}
                            >
                              Edit
                            </Link>
                          </Button>
                          <Button 
                            variant='ghost' 
                            size='sm' 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                            onClick={(e) => { e.stopPropagation(); openDeleteDialog(pat); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <div className='flex items-center justify-between px-2 py-4'>
              <div className='text-sm text-muted-foreground'>
                Showing {filteredPatterns.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPatterns.length)} of {filteredPatterns.length} entries
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
                  Page {currentPage} of {Math.max(1, Math.ceil(filteredPatterns.length / ITEMS_PER_PAGE))}
                </div>
                <Button 
                  variant='outline' 
                  size='sm' 
                  disabled={currentPage >= Math.ceil(filteredPatterns.length / ITEMS_PER_PAGE) || filteredPatterns.length === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Main>

      {patternToDelete && (
        <MigrateOrDeleteDialog
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Pattern"
          itemName={patternToDelete.title}
          items={patterns.filter(p => p.id !== patternToDelete.id).map(p => ({ id: p.id, name: p.title }))}
          onDelete={handleDelete}
          onMigrate={handleMigrate}
        />
      )}
    </>
  )
}
