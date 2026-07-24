import { useState, useEffect, type ChangeEvent } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { Plus, LayoutTemplate, Trash2 } from 'lucide-react'
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

const route = getRouteApi('/_authenticated/ui-elements/')

export function UiElements() {
  const { filter = '' } = route.useSearch()
  const navigate = useNavigate({ from: route.id })
  const [searchTerm, setSearchTerm] = useState(filter)
  const [uiElements, setUiElements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUiElements = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/v1/ui-elements')
        if (!res.ok) throw new Error('Failed to fetch UI elements')
        const data = await res.json()
        setUiElements(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUiElements()
  }, [])

  const filteredElements = uiElements.filter((el) =>
    el.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    navigate({
      search: (prev: any) => ({
        ...prev,
        filter: e.target.value || undefined,
      }),
    })
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [uiElementToDelete, setUiElementToDelete] = useState<any>(null)

  const openDeleteDialog = (uiElement: any) => {
    setUiElementToDelete(uiElement)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!uiElementToDelete) return
    const res = await fetch(`http://localhost:4000/api/v1/ui-elements/${uiElementToDelete.id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setUiElements(uiElements.filter(el => el.id !== uiElementToDelete.id))
    } else {
      throw new Error('Failed to delete')
    }
  }

  const handleMigrate = async (targetId: string) => {
    if (!uiElementToDelete) return
    const res = await fetch(`http://localhost:4000/api/v1/ui-elements/${uiElementToDelete.id}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    })
    if (res.ok) {
      setUiElements(uiElements.filter(el => el.id !== uiElementToDelete.id))
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
            <h1 className='text-2xl font-bold tracking-tight'>UI Elements</h1>
            <p className='text-muted-foreground'>
              Reusable structural tags applied to screens (e.g., Tab Bar, Progress Bar).
            </p>
          </div>
          <Button asChild>
            <Link to='/ui-elements/new'>
              <Plus className='mr-2 h-4 w-4' /> Create UI Element
            </Link>
          </Button>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Search UI Elements...'
              className='h-9 w-40 lg:w-62.5'
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <Separator className='shadow-sm' />

        {isLoading ? (
          <TableSkeleton columns={5} />
        ) : filteredElements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center border rounded-lg border-dashed mt-4 bg-muted/10">
            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full mb-4">
              <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No UI elements found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {searchTerm 
                ? `No UI elements match the search "${searchTerm}". Try adjusting your filters.` 
                : "You haven't created any UI elements yet. UI elements help you tag structural components."}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link to='/ui-elements/new'>
                  <Plus className='mr-2 h-4 w-4' /> Create Your First UI Element
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
                    <TableHead>Element Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Screen Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredElements.map((el) => (
                    <TableRow 
                      key={el.id} 
                      className='cursor-pointer hover:bg-muted/50'
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('button')) {
                          navigate({ to: '/ui-elements/$elementId', params: { elementId: el.id } })
                        }
                      }}
                    >
                      <TableCell className='font-medium'>{el.title}</TableCell>
                      <TableCell className='text-muted-foreground'>{el.slug}</TableCell>
                      <TableCell>{el.screens?.length || 0} Screens</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            el.status === 'LIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {el.status}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className="flex justify-end gap-2">
                          <Button variant='ghost' size='sm' asChild>
                            <Link to='/ui-elements/$elementId/edit' params={{ elementId: el.id }}>
                              Edit
                            </Link>
                          </Button>
                          <Button 
                            variant='ghost' 
                            size='sm' 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                            onClick={(e) => { e.stopPropagation(); openDeleteDialog(el); }}
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
                Showing 1 to {filteredElements.length} of {filteredElements.length} entries
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
          </>
        )}
      </Main>

      {uiElementToDelete && (
        <MigrateOrDeleteDialog
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete UI Element"
          itemName={uiElementToDelete.title}
          items={uiElements.filter(el => el.id !== uiElementToDelete.id).map(el => ({ id: el.id, name: el.title }))}
          onDelete={handleDelete}
          onMigrate={handleMigrate}
        />
      )}
    </>
  )
}
