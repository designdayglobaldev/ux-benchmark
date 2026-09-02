import { useDebounce } from '@/hooks/use-debounce';
import { useState, useEffect, type ChangeEvent } from 'react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { Plus, AppWindow, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
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
import { AppCardSkeleton } from '@/components/ui/app-card-skeleton'

const route = getRouteApi('/_authenticated/apps/')

export function Apps() {
  const { filter = '' } = route.useSearch()
  const navigate = route.useNavigate()
  const [searchTerm, setSearchTerm] = useState(filter)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [apps, setApps] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, catsRes, subCatsRes] = await Promise.all([
          fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/apps'),
          fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/categories'),
          fetch((import.meta.env.VITE_API_URL || '') + '/api/v1/subcategories')
        ])
        const [appsData, catsData, subCatsData] = await Promise.all([
          appsRes.json(),
          catsRes.json(),
          subCatsRes.json()
        ])
        setApps(appsData)
        setCategories(catsData)
        setSubcategories(subCatsData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleDeleteApp = async (appId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/apps/${appId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setApps(apps => apps.filter(a => a.id !== appId))
      }
    } catch (error) {
      console.error('Failed to delete app:', error)
    }
  }

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesPlatform = platformFilter === 'all' || (app.platform && app.platform.includes(platformFilter))
    const matchesCategory = categoryFilter === 'all' || app.categoryId === categoryFilter
    const matchesSubcategory = subcategoryFilter === 'all' || app.subcategoryId === subcategoryFilter
    
    return matchesSearch && matchesStatus && matchesPlatform && matchesCategory && matchesSubcategory
  })

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
            <h1 className='text-2xl font-bold tracking-tight'>Apps</h1>
            <p className='text-muted-foreground'>
              Manage the directory of benchmarked applications.
            </p>
          </div>
          <Button asChild>
            <Link to='/apps/new'>
              <Plus className='mr-2 h-4 w-4' /> Add New App
            </Link>
          </Button>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-wrap gap-4 sm:my-4 flex-1 items-center'>
            <Input
              placeholder='Search apps...'
              className='h-9 w-40 lg:w-62.5'
              value={searchTerm}
              onChange={handleSearch}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="LIVE">Live</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="android">Android</SelectItem>
                <SelectItem value="webpage">Web Page</SelectItem>
                <SelectItem value="webapp">Web App</SelectItem>
                <SelectItem value="crossplatform">Cross Platform</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {subcategories
                  .filter((sc) => categoryFilter === 'all' || sc.categoryId === categoryFilter)
                  .map((sc) => (
                    <SelectItem key={sc.id} value={sc.id}>{sc.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Separator className='shadow-sm' />

        {isLoading ? (
          <div className="grid gap-4 pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <AppCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center border rounded-lg border-dashed mt-4 bg-muted/10">
            <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full mb-4">
              <AppWindow className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No apps found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {searchTerm 
                ? `No apps match the search "${searchTerm}". Try adjusting your filters.` 
                : "You haven't added any benchmarked applications yet. Click the button below to get started."}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link to='/apps/new'>
                  <Plus className='mr-2 h-4 w-4' /> Add Your First App
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3'>
            {filteredApps.map((app) => (
              <li
                key={app.id}
                className='relative flex flex-col rounded-lg border p-4 hover:shadow-md transition-all hover:border-primary/50 group'
              >
                {/* This link covers the entire card, allowing you to click anywhere to view details */}
                <Link
                  to='/apps/$appId'
                  params={{ appId: app.id }}
                  className='absolute inset-0 z-0'
                  aria-label='View App Details'
                />
                
                {/* Content layer - pointer-events-none lets clicks pass through to the background link */}
                <div className='pointer-events-none relative z-10 flex-1'>
                  <div className='mb-4 flex items-center gap-4'>
                    <img
                      src={app.appLogo}
                      alt={app.name}
                      className='h-12 w-12 rounded-xl object-cover bg-muted group-hover:scale-105 transition-transform'
                    />
                    <div>
                      <h2 className='font-semibold group-hover:text-primary transition-colors'>{app.name}</h2>
                      <p className='text-sm text-muted-foreground'>
                        {app.category?.title || 'Uncategorized'}
                      </p>
                    </div>
                    <div className='ml-auto'>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          app.status === 'LIVE'
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                            : 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                  <p className='line-clamp-2 text-sm text-gray-500 mb-4'>
                    {app.description}
                  </p>
                  <div className='flex gap-2 mb-4'>
                    {app.platform.map((p: string) => (
                      <span
                        key={p}
                        className='inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium'
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Button layer - relative z-20 so it sits above the background link and can be clicked */}
                <div className='relative z-20 mt-auto flex gap-2'>
                  <Button variant='outline' className='flex-1' asChild>
                    <Link to='/apps/$appId/edit' params={{ appId: app.id }}>
                      Edit App
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the app "{app.name}" along with all its screens and flows.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteApp(app.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Main>
    </>
  )
}
