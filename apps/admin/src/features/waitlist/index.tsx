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

export function Waitlist() {
  const [waitlist, setWaitlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<{email: string, action: 'approve' | 'reject'} | null>(null)

  useEffect(() => {
    fetchWaitlist()
  }, [])

  const fetchWaitlist = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/auth/waitlist`)
      const data = await res.json()
      setWaitlist(data)
    } catch (err) {
      console.error('Error fetching waitlist', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (email: string) => {
    try {
      setProcessingId({ email, action: 'approve' })
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/auth/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (res.ok) {
        fetchWaitlist()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (email: string) => {
    try {
      setProcessingId({ email, action: 'reject' })
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/auth/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (res.ok) {
        fetchWaitlist()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Users</h2>
            <p className='text-muted-foreground'>
              Manage beta testing requests and user access.
            </p>
          </div>
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                  </TableRow>
                ) : waitlist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No waitlist entries found.</TableCell>
                  </TableRow>
                ) : (
                  waitlist.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>{entry.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={entry.status === 'APPROVED' ? 'default' : entry.status === 'REJECTED' ? 'destructive' : 'secondary'}
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={entry.status !== 'PENDING' || processingId !== null}
                            onClick={() => handleApprove(entry.email)}
                          >
                            {processingId?.email === entry.email && processingId?.action === 'approve' ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            disabled={entry.status !== 'PENDING' || processingId !== null}
                            onClick={() => handleReject(entry.email)}
                          >
                            {processingId?.email === entry.email && processingId?.action === 'reject' ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Main>
    </>
  )
}
