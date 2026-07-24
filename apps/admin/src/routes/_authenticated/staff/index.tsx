import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, UserCog, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/staff/')({
  component: StaffList,
})

const STAFF = [
  { id: '1', name: 'Admin User', email: 'admin@designday.io', role: 'ADMIN', status: 'ACTIVE' },
  { id: '2', name: 'Content Creator', email: 'editor@designday.io', role: 'EDITOR', status: 'ACTIVE' },
  { id: '3', name: 'Guest Viewer', email: 'guest@designday.io', role: 'VIEWER', status: 'INACTIVE' },
]

function StaffList() {
  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <UserCog className='h-5 w-5 text-muted-foreground' />
          <h1 className='text-lg font-semibold'>Staff Management</h1>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <ProfileDropdown />
        </div>
      </Header>
      
      <Main>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Team Members</h2>
            <p className='text-muted-foreground'>Manage your team's access, roles, and permissions.</p>
          </div>
          <Button asChild>
            <Link to='/staff/new'>
              <Plus className='mr-2 h-4 w-4' /> Add Staff
            </Link>
          </Button>
        </div>

        <div className="rounded-md border bg-card">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email / ID</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {STAFF.map((member) => (
                <tr key={member.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{member.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{member.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-500' : 'bg-destructive'}`} />
                      {member.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Main>
    </>
  )
}
