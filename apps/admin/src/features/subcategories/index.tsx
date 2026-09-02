import { useDebounce } from '@/hooks/use-debounce';
import { useState, useEffect, type ChangeEvent } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { Plus, FolderOpen, Trash2 } from 'lucide-react'
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

const route = getRouteApi('/_authenticated/subcategories/')

export function Subcategories() {
  const { filter = '' } = route.useSearch() as any
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState(filter)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/subcategories')
        const data = await res.json()
        setSubcategories(data)
      } catch (error) {
        console.error('Failed to fetch subcategories:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubcategories()
  }, [])

  const filteredSubcategories = subcategories.filter((cat) =>
    cat.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  )

  const paginatedSubcategories = filteredSubcategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage)

  useEffect(() => {
    navigate({
      search: ((prev: any) => ({
        ...prev,
        filter: debouncedSearchTerm || undefined,
      })) as any,
    })
  }, [debouncedSearchTerm, navigate])

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<any>(null)

  const openDeleteDialog = (subcategory: any) => {
    setSubcategoryToDelete(subcategory)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!subcategoryToDelete) return
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/subcategories/${subcategoryToDelete.id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setSubcategories(subcategories.filter(c => c.id !== subcategoryToDelete.id))
    } else {
      throw new Error('Failed to delete')
    }
  }

  const handleMigrate = async (targetId: string) => {
    if (!subcategoryToDelete) return
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/subcategories/${subcategoryToDelete.id}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    })
    if (res.ok) {
      setSubcategories(subcategories.filter(c => c.id !== subcategoryToDelete.id))
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
            <h1 className='text-2xl font-bold tracking-tight'>Subcategories</h1>
            <p className='text-muted-foreground'>
              Broad classifications used to organize the catalog of applications.
            </p>
          </div>
          <Button asChild>
            <Link to='/subcategories/new'>
              <Plus className='mr-2 h-4 w-4' /> Create Subcategory
            </Link>
          </Button>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Search subcategories...'
              className='h-9 w-40 lg:w-62.5'
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <Separator className='shadow-sm' />

        {isLoading ? (
          <TableSkeleton columns={4} />
        ) : filteredSubcategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center border rounded-lg border-dashed mt-4 bg-muted/10">
            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No subcategories found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {searchTerm 
                ? `No subcategories match the search "${searchTerm}". Try adjusting your filters.` 
                : "You haven't created any subcategories yet. Subcategories help you organize benchmarked applications."}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link to='/subcategories/new'>
                  <Plus className='mr-2 h-4 w-4' /> Create Your First Subcategory
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
                    <TableHead>Subcategory Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSubcategories.map((cat) => (
                    <TableRow 
                      key={cat.id} 
                      className='cursor-pointer hover:bg-muted/50'
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (!target.closest('button') && !target.closest('a')) {
                          navigate({ to: '/subcategories/$subcategoryId', params: { subcategoryId: cat.id } })
                        }
                      }}
                    >
                      <TableCell className='font-medium'>{cat.title}</TableCell>
                      <TableCell className='text-muted-foreground'>{cat.slug}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            cat.status === 'LIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {cat.status}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className="flex justify-end gap-2">
                          <Button variant='ghost' size='sm' asChild>
                            <Link to='/subcategories/$subcategoryId/edit' params={{ subcategoryId: cat.id }}>
                              Edit
                            </Link>
                          </Button>
                          <Button 
                            variant='ghost' 
                            size='sm' 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                            onClick={(e) => { e.stopPropagation(); openDeleteDialog(cat); }}
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
            {totalPages > 0 && (
              <div className='flex items-center justify-between px-2 py-4'>
                <div className='text-sm text-muted-foreground'>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSubcategories.length)} of {filteredSubcategories.length} entries
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
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button 
                        key={i + 1}
                        variant={currentPage === i + 1 ? 'default' : 'outline'}
                        size='sm' 
                        onClick={() => setCurrentPage(i + 1)}
                        className={currentPage === i + 1 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant='outline' 
                    size='sm' 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Main>

      {subcategoryToDelete && (
        <MigrateOrDeleteDialog
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Subcategory"
          itemName={subcategoryToDelete.title}
          items={subcategories.filter(c => c.id !== subcategoryToDelete.id).map(c => ({ id: c.id, name: c.title }))}
          onDelete={handleDelete}
          onMigrate={handleMigrate}
        />
      )}
    </>
  )
}
