import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'

const PERMISSIONS = [
  { id: 'MANAGE_USERS', label: 'Manage Users & Staff' },
  { id: 'MANAGE_APPS', label: 'Manage Apps & Flows' },
  { id: 'MANAGE_TAXONOMY', label: 'Manage Taxonomy (Categories, UI Elements)' },
  { id: 'PUBLISH_CONTENT', label: 'Publish Content directly to LIVE' }
]

export function StaffForm() {
  return (
    <>
      <Header>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link to='/staff'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <h1 className='text-lg font-semibold'>Add Staff Member</h1>
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <Button>
            <Save className='mr-2 h-4 w-4' /> Save Staff
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='max-w-3xl mx-auto'>
        <div className='grid gap-6'>
          
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
              <CardDescription>Set the login details for this staff member.</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6'>
              <div className='grid gap-3'>
                <Label htmlFor='name'>Full Name</Label>
                <Input id='name' placeholder='e.g. Jane Doe' />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='email'>Email Address / Login ID</Label>
                <Input id='email' type='email' placeholder='jane@designday.io' />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='password'>Temporary Password</Label>
                <Input id='password' type='password' placeholder='••••••••' />
                <p className='text-[11px] text-muted-foreground'>They will be prompted to change this upon first login.</p>
              </div>
            </CardContent>
          </Card>

          {/* Role & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Role & Permissions</CardTitle>
              <CardDescription>Determine what this user is allowed to do in the Admin panel.</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6'>
              <div className='grid gap-3'>
                <Label htmlFor='role'>Primary Role</Label>
                <select id='role' className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                  <option value='ADMIN'>Admin (Full Access)</option>
                  <option value='EDITOR'>Editor (Content Creation)</option>
                  <option value='VIEWER'>Viewer (Read Only)</option>
                </select>
              </div>

              <Separator />

              <div className='grid gap-4'>
                <Label>Granular Permissions</Label>
                <div className='grid gap-3'>
                  {PERMISSIONS.map(permission => (
                    <label key={permission.id} className='flex items-center gap-3 cursor-pointer'>
                      <input type="checkbox" className='w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary' />
                      <span className='text-sm font-medium leading-none'>{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </Main>
    </>
  )
}
