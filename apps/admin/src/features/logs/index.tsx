import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Sparkles, 
  RefreshCw, 
  Layers, 
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function Logs() {
  const [screens, setScreens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(20)

  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [batchAnalyzing, setBatchAnalyzing] = useState(false)
  const [showTokenError, setShowTokenError] = useState(false)

  useEffect(() => {
    fetchUnprocessedScreens(currentPage)
  }, [currentPage])

  const fetchUnprocessedScreens = async (page = 1) => {
    try {
      setLoading(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/screens/unprocessed?page=${page}&limit=${itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch unprocessed screens')
      const payload = await res.json()
      setScreens(payload.data || [])
      if (payload.meta) {
        setTotalPages(payload.meta.totalPages || 0)
        setTotalItems(payload.meta.total || 0)
      }
    } catch (err: any) {
      console.error('Error fetching unprocessed screens', err)
      toast.error('Failed to load screens without data')
    } finally {
      setLoading(false)
    }
  }

  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)

  const handleAnalyze = async (screenId: string) => {
    try {
      setAnalyzingId(screenId)
      toast.info('Analyzing screen with Claude AI...')

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/screens/${screenId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const isJson = res.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await res.json() : null

      if (res.status === 402 || (data?.error && data.error.includes('credits expired'))) {
        setShowTokenError(true)
        return
      }

      if (!res.ok) {
        throw new Error(data?.error || `Analysis failed (${res.status} ${res.statusText})`)
      }

      toast.success('AI Analysis completed successfully!')
      // Refresh current page
      fetchUnprocessedScreens(currentPage)
    } catch (err: any) {
      console.error('Analyze error:', err)
      toast.error(err.message || 'Failed to analyze screen')
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleBatchAnalyze = async () => {
    if (screens.length === 0) return

    try {
      setBatchAnalyzing(true)
      const total = screens.length
      setBatchProgress({ current: 0, total })
      toast.info(`Starting sequential analysis for ${total} screens...`)

      let successCount = 0

      for (let i = 0; i < screens.length; i++) {
        const screen = screens[i]
        setBatchProgress({ current: i + 1, total })

        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/screens/${screen.id}/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })

          const isJson = res.headers.get('content-type')?.includes('application/json')
          const data = isJson ? await res.json() : null

          if (res.status === 402 || (data?.error && data.error.includes('credits expired'))) {
            setShowTokenError(true)
            toast.error('Claude API credits expired. Stopped re-analysis.')
            break
          }

          if (res.ok) {
            successCount++
          } else {
            console.warn(`Screen ${screen.id} analysis failed with status: ${res.status}`)
          }
        } catch (itemErr: any) {
          console.error(`Error analyzing screen ${screen.id}:`, itemErr)
        }
      }

      toast.success(`Completed! Analyzed ${successCount} of ${total} screens.`)
      // Refresh list
      fetchUnprocessedScreens(currentPage)
    } catch (err: any) {
      console.error('Batch error:', err)
      toast.error(err.message || 'Batch analysis encountered an error')
    } finally {
      setBatchAnalyzing(false)
      setBatchProgress(null)
    }
  }

  const getVisiblePages = (current: number, total: number) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
    return [1, '...', current - 1, current, current + 1, '...', total]
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Incomplete Screens</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Screens that were cut off or uploaded without AI analysis. You can re-run Claude analysis individually or in batch.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchUnprocessedScreens(currentPage)} 
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {screens.length > 0 && (
              <Button 
                size="sm" 
                onClick={handleBatchAnalyze} 
                disabled={batchAnalyzing || loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Sparkles className={`w-4 h-4 mr-2 ${batchAnalyzing ? 'animate-spin' : ''}`} />
                {batchAnalyzing 
                  ? (batchProgress ? `Analyzing ${batchProgress.current}/${batchProgress.total}...` : 'Analyzing Screens...') 
                  : `Re-analyze Page (${screens.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* Status card banner */}
        <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-foreground">
              Why do screens appear here? {totalItems > 0 && `(${totalItems} total pending)`}
            </span>
            <p className="text-muted-foreground mt-0.5">
              When Claude runs out of API credits or times out during background processing, screens are still saved safely to your library but lack UX analysis and tags. You can re-run Claude AI anytime once your Anthropic account is funded.
            </p>
          </div>
        </div>

        <div className='rounded-md border bg-card'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Thumbnail</TableHead>
                <TableHead>Screen Name</TableHead>
                <TableHead>App</TableHead>
                <TableHead>Flow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Checking for screens with missing data...
                  </TableCell>
                </TableRow>
              ) : screens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-center py-12 text-muted-foreground'>
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                    <p className="font-medium text-foreground">All screens analyzed!</p>
                    <p className="text-xs text-muted-foreground mt-1">There are no screens waiting for AI analysis.</p>
                  </TableCell>
                </TableRow>
              ) : (
                screens.map((screen) => (
                  <TableRow key={screen.id}>
                    <TableCell>
                      <div className="w-14 h-20 rounded-md overflow-hidden bg-muted border border-border">
                        {screen.imageUrl ? (
                          <img 
                            src={screen.imageUrl} 
                            alt={screen.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Layers className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='font-medium'>
                      <div>{screen.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{screen.slug}</div>
                    </TableCell>
                    <TableCell>
                      {screen.app?.name || '—'}
                    </TableCell>
                    <TableCell>
                      {screen.flow?.name || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10">
                        Missing AI Data
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(screen.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        size="sm"
                        disabled={analyzingId === screen.id || batchAnalyzing}
                        onClick={() => handleAnalyze(screen.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${analyzingId === screen.id ? 'animate-spin' : ''}`} />
                        {analyzingId === screen.id ? 'Analyzing...' : 'Analyze'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} screens
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant='outline' 
                size='sm' 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {getVisiblePages(currentPage, totalPages).map((page, i) => (
                  page === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button 
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size='sm' 
                      onClick={() => setCurrentPage(page as number)}
                      className={currentPage === page ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                    >
                      {page}
                    </Button>
                  )
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
      </Main>

      {/* Claude credit expiry modal */}
      <AlertDialog open={showTokenError} onOpenChange={setShowTokenError}>
        <AlertDialogContent className="bg-[#18181b] border-red-900/50 text-white max-w-lg">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-bold text-red-400">
                  Claude AI Credits Depleted!
                </AlertDialogTitle>
                <span className="text-xs text-zinc-400">Anthropic API Billing Required</span>
              </div>
            </div>
            <AlertDialogDescription className="text-zinc-300 space-y-3 pt-2">
              <p>
                The screen could not be analyzed because your <strong>Claude AI (Anthropic)</strong> API account has run out of credits or has an expired balance.
              </p>
              <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-zinc-400">
                Please visit your <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noreferrer" className="text-indigo-400 underline inline-flex items-center ml-1">Anthropic Console <ExternalLink className="w-3 h-3 ml-0.5" /></a> and recharge your balance. Once funded, you can click "Analyze" or "Re-analyze Page" here in Logs!
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction 
              onClick={() => setShowTokenError(false)} 
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
