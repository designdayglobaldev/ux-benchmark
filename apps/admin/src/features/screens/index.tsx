import { useState, useEffect, type ChangeEvent } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { Plus, Smartphone, Trash2 } from 'lucide-react'
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

const route = getRouteApi('/_authenticated/screens/')

export function Screens() {
  const { filter = '' } = route.useSearch()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState(filter)
  const [screens, setScreens] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchScreens = () => {
    fetch('http://localhost:4000/api/v1/screens')
      .then(res => res.json())
      .then(data => {
        setScreens(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch screens:', err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchScreens()
  }, [])

  const handleDeleteScreen = async (screenId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/screens/${screenId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setScreens(screens => screens.filter(s => s.id !== screenId))
      }
    } catch (error) {
      console.error('Failed to delete screen:', error)
    }
  }

  const filteredScreens = screens.filter((screen) =>
    screen.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    screen.app?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    navigate({
      search: ((prev: any) => ({
        ...prev,
        filter: e.target.value || undefined,
      })) as any,
    })
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
            <h1 className='text-2xl font-bold tracking-tight'>Screens</h1>
            <p className='text-muted-foreground'>
              Manage individual UI screenshots and their dynamic analysis blocks.
            </p>
          </div>
          <Button asChild>
            <Link to='/screens/new'>
              <Plus className='mr-2 h-4 w-4' /> Upload Screen
            </Link>
          </Button>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Search screens...'
              className='h-9 w-40 lg:w-62.5'
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <Separator className='shadow-sm' />

        {isLoading ? (
          <TableSkeleton columns={6} />
        ) : filteredScreens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center border rounded-lg border-dashed mt-4 bg-muted/10">
            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full mb-4">
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No screens found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {searchTerm 
                ? `No screens match the search "${searchTerm}". Try adjusting your filters.` 
                : "You haven't uploaded any screens yet. Screens are the core visual assets."}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link to='/screens/new'>
                  <Plus className='mr-2 h-4 w-4' /> Upload Your First Screen
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
                    <TableHead className='w-[80px]'>Thumbnail</TableHead>
                    <TableHead>Screen Name</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Assigned Flow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScreens.map((screen) => (
                    <TableRow 
                      key={screen.id} 
                      className='cursor-pointer hover:bg-muted/50'
                      onClick={(e) => {
                        // prevent navigation if clicking on a button or link
                        const target = e.target as HTMLElement
                        if (!target.closest('button') && !target.closest('a')) {
                          navigate({ to: '/screens/$screenId', params: { screenId: screen.id } })
                        }
                      }}
                    >
                      <TableCell>
                        <div className='h-12 w-8 bg-muted rounded overflow-hidden'>
                          {screen.imageUrl ? (
                            <img 
                              src={screen.imageUrl} 
                              alt={screen.name} 
                              className='w-full h-full object-cover' 
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-[10px]'>No Img</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='font-medium'>{screen.name}</TableCell>
                      <TableCell>{screen.app?.name}</TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-1'>
                          {screen.flow ? (
                            <span className='px-2 py-0.5 bg-muted text-xs rounded-md border'>
                              {screen.flow.name} {screen.screenNo ? <span className='text-muted-foreground ml-1'>(#{screen.screenNo})</span> : null}
                            </span>
                          ) : (
                            <span className='text-muted-foreground text-xs'>Unassigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            screen.status === 'LIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {screen.status}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className="flex justify-end gap-2">
                          <Button variant='ghost' size='sm' asChild>
                            <Link to='/screens/$screenId/edit' params={{ screenId: screen.id }}>
                              Edit
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant='ghost' size='sm' className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the screen "{screen.name}" and remove its data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteScreen(screen.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
          </>
        )}
      </Main>
    </>
  )
}
