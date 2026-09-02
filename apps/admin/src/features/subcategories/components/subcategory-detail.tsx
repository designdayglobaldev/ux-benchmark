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

export function SubcategoryDetail() {
  const routeApi = getRouteApi('/_authenticated/subcategories/$subcategoryId/')
  const { subcategoryId } = routeApi.useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [subcategory, setSubcategory] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubcategory = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/subcategories/${subcategoryId}`)
        if (!res.ok) throw new Error('Failed to fetch subcategory')
        const data = await res.json()
        setSubcategory(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    if (subcategoryId) fetchSubcategory()
  }, [subcategoryId])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!subcategory) {
    return <div className="p-8 text-center text-muted-foreground">Subcategory not found</div>
  }

  const apps = subcategory.apps || []
  const filteredApps = apps.filter((app: any) => 
    app.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  )

  return (
    <>
      <Header>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/subcategories'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <div className='flex items-center gap-2'>
            <h1 className='text-lg font-semibold'>{subcategory.title}</h1>
            <Badge variant={subcategory.status === 'LIVE' ? 'default' : 'secondary'}>{subcategory.status}</Badge>
          </div>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button variant='outline' asChild>
            <Link to='/subcategories/$subcategoryId/edit' params={{ subcategoryId: subcategory.id }}>
              <Edit className='mr-2 h-4 w-4' /> Edit Subcategory
            </Link>
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Associated Apps</h1>
            <p className='text-muted-foreground'>
              All applications currently classified under the {subcategory.title} subcategory.
            </p>
          </div>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Search apps...'
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
                <TableHead>Screens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.map((app: any) => (
                <TableRow key={app.id} className='hover:bg-muted/50 transition-colors'>
                  <TableCell className='font-medium'>{app.name}</TableCell>
                  <TableCell>{app.screens?.length || 0} Screens</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        app.status === 'LIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button variant='ghost' size='sm' asChild>
                      <Link to='/apps/$appId' params={{ appId: app.id }}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredApps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className='h-24 text-center'>
                    No apps found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className='flex items-center justify-between px-2 py-4'>
          <div className='text-sm text-muted-foreground'>
            Showing 1 to {filteredApps.length} of {filteredApps.length} entries
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm' disabled>
              Previous
            </Button>
            <Button variant='outline' size='sm' className='bg-primary text-primary-foreground hover:bg-primary/90' disabled={filteredApps.length === 0}>
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
