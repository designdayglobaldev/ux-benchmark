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

const route = getRouteApi('/_authenticated/categories/')

export function Categories() {
  const { filter = '' } = route.useSearch() as any
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState(filter)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/categories')
        const data = await res.json()
        setCategories(data)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const filteredCategories = categories.filter((cat) =>
    cat.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  )

  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)

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
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null)

  const openDeleteDialog = (category: any) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/categories/${categoryToDelete.id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setCategories(categories.filter(c => c.id !== categoryToDelete.id))
    } else {
      throw new Error('Failed to delete')
    }
  }

  const handleMigrate = async (targetId: string) => {
    if (!categoryToDelete) return
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/categories/${categoryToDelete.id}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    })
    if (res.ok) {
      setCategories(categories.filter(c => c.id !== categoryToDelete.id))
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
            <h1 className='text-2xl font-bold tracking-tight'>Categories</h1>
            <p className='text-muted-foreground'>
              Broad classifications used to organize the catalog of applications.
            </p>
          </div>
          <Button asChild>
            <Link to='/categories/new'>
              <Plus className='mr-2 h-4 w-4' /> Create Category
            </Link>
          </Button>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Search categories...'
              className='h-9 w-40 lg:w-62.5'
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <Separator className='shadow-sm' />

        {isLoading ? (
          <TableSkeleton columns={4} />
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center border rounded-lg border-dashed mt-4 bg-muted/10">
            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {searchTerm 
                ? `No categories match the search "${searchTerm}". Try adjusting your filters.` 
                : "You haven't created any categories yet. Categories help you organize benchmarked applications."}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link to='/categories/new'>
                  <Plus className='mr-2 h-4 w-4' /> Create Your First Category
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className='border rounded-md mt-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((cat) => (
                    <TableRow 
                      key={cat.id} 
                      className='cursor-pointer hover:bg-muted/50'
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (!target.closest('button') && !target.closest('a')) {
                          navigate({ to: '/categories/$categoryId', params: { categoryId: cat.id } })
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
                            <Link to='/categories/$categoryId/edit' params={{ categoryId: cat.id }}>
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCategories.length)} of {filteredCategories.length} entries
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

      {categoryToDelete && (
        <MigrateOrDeleteDialog
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Category"
          itemName={categoryToDelete.title}
          items={categories.filter(c => c.id !== categoryToDelete.id).map(c => ({ id: c.id, name: c.title }))}
          onDelete={handleDelete}
          onMigrate={handleMigrate}
        />
      )}
    </>
  )
}
