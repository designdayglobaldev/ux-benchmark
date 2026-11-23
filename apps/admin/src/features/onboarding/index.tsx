import { useState, useEffect } from 'react'
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  PenTool,
  BarChart3,
  Code2,
  Briefcase,
  Layers,
  HelpCircle,
  RefreshCw,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'

interface OnboardingOption {
  id: string
  type: 'ROLE' | 'CHALLENGE'
  label: string
  description?: string
  iconName?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

interface AnalyticsData {
  totalUsers: number
  totalOnboarded: number
  completionRate: number
  rolesBreakdown: { role: string; count: number }[]
  challengesBreakdown: { challenge: string; count: number }[]
}

const AVAILABLE_ICONS = [
  { name: 'PenTool', label: 'Pen Tool (Design)', icon: PenTool },
  { name: 'BarChart3', label: 'Bar Chart (Product/Analytics)', icon: BarChart3 },
  { name: 'Code2', label: 'Code (Engineer/Dev)', icon: Code2 },
  { name: 'Briefcase', label: 'Briefcase (Executive/CTO)', icon: Briefcase },
  { name: 'Sparkles', label: 'Sparkles (General/AI)', icon: Sparkles },
  { name: 'Layers', label: 'Layers (Architecture)', icon: Layers },
]

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1`

export default function OnboardingFeature() {
  const [options, setOptions] = useState<OnboardingOption[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ROLE' | 'CHALLENGE'>('ROLE')

  // Create / Edit modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<OnboardingOption | null>(null)
  const [formType, setFormType] = useState<'ROLE' | 'CHALLENGE'>('ROLE')
  const [formLabel, setFormLabel] = useState('')
  const [formIcon, setFormIcon] = useState('PenTool')
  const [formSortOrder, setFormSortOrder] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const [optRes, anaRes] = await Promise.all([
        fetch(`${API_URL}/admin/onboarding/options`, { headers }),
        fetch(`${API_URL}/admin/onboarding/analytics`, { headers }),
      ])

      const optJson = await optRes.json()
      const anaJson = await anaRes.json()

      if (optJson.success) setOptions(optJson.data || [])
      if (anaJson.success) setAnalytics(anaJson.data || null)
    } catch (err) {
      console.error('Failed to load onboarding data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = (type: 'ROLE' | 'CHALLENGE') => {
    setEditingOption(null)
    setFormType(type)
    setFormLabel('')
    setFormIcon(type === 'ROLE' ? 'PenTool' : '')
    setFormSortOrder(options.filter((o) => o.type === type).length + 1)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (option: OnboardingOption) => {
    setEditingOption(option)
    setFormType(option.type)
    setFormLabel(option.label)
    setFormIcon(option.iconName || 'PenTool')
    setFormSortOrder(option.sortOrder)
    setIsDialogOpen(true)
  }

  const handleSaveOption = async () => {
    if (!formLabel.trim()) return
    setIsSaving(true)
    try {
      const headers = await getAuthHeaders()
      if (editingOption) {
        // Update
        const res = await fetch(`${API_URL}/admin/onboarding/options/${editingOption.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            label: formLabel.trim(),
            iconName: formType === 'ROLE' ? formIcon : null,
            sortOrder: Number(formSortOrder),
          }),
        })
        if (res.ok) {
          setIsDialogOpen(false)
          fetchData()
        }
      } else {
        // Create
        const res = await fetch(`${API_URL}/admin/onboarding/options`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: formType,
            label: formLabel.trim(),
            iconName: formType === 'ROLE' ? formIcon : null,
            sortOrder: Number(formSortOrder),
            isActive: true,
          }),
        })
        if (res.ok) {
          setIsDialogOpen(false)
          fetchData()
        }
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (option: OnboardingOption) => {
    try {
      const headers = await getAuthHeaders()
      await fetch(`${API_URL}/admin/onboarding/options/${option.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive: !option.isActive }),
      })
      fetchData()
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  const handleDeleteOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return
    try {
      const headers = await getAuthHeaders()
      await fetch(`${API_URL}/admin/onboarding/options/${id}`, {
        method: 'DELETE',
        headers,
      })
      fetchData()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const filteredOptions = options.filter((o) => o.type === activeTab)

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Onboarding Configuration</h2>
            <p className="text-muted-foreground">
              Configure dynamic roles, challenges, and questionnaire choices presented to users in onboarding.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => handleOpenCreate(activeTab)}>
              <Plus className="mr-2 h-4 w-4" />
              Add {activeTab === 'ROLE' ? 'Role' : 'Challenge'}
            </Button>
          </div>
        </div>

      {/* Analytics Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalUsers ?? 0}</div>
            <p className="text-xs text-muted-foreground">Accounts in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Onboarding</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalOnboarded ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.completionRate ?? 0}% overall completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Demographic</CardTitle>
            <Check className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-semibold truncate">
              {analytics?.rolesBreakdown?.[0]?.role || 'No data yet'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.rolesBreakdown?.[0]
                ? `${analytics.rolesBreakdown[0].count} users chose this role`
                : 'Waiting for users to onboard'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Roles vs Challenges */}
      <div className="flex border-b border-border space-x-4">
        <button
          onClick={() => setActiveTab('ROLE')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'ROLE'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Roles (Step 2)
          <Badge variant="secondary" className="ml-2">
            {options.filter((o) => o.type === 'ROLE').length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('CHALLENGE')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'CHALLENGE'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Challenges (Step 3)
          <Badge variant="secondary" className="ml-2">
            {options.filter((o) => o.type === 'CHALLENGE').length}
          </Badge>
        </button>
      </div>

      {/* Options Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOptions.map((opt) => {
          const IconDef = AVAILABLE_ICONS.find((i) => i.name === opt.iconName)?.icon || HelpCircle
          return (
            <Card key={opt.id} className={!opt.isActive ? 'opacity-60 bg-muted/40' : ''}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  {opt.type === 'ROLE' && (
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <IconDef className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-base font-semibold">{opt.label}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Sort Order: #{opt.sortOrder}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={opt.isActive ? 'default' : 'outline'}>
                  {opt.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-2 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(opt)}
                  className="text-xs"
                >
                  {opt.isActive ? 'Disable' : 'Enable'}
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(opt)}>
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteOption(opt.id)}
                    className="hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOption ? 'Edit' : 'Add New'} {formType === 'ROLE' ? 'Role' : 'Challenge'}
            </DialogTitle>
            <DialogDescription>
              This option will immediately appear in the user onboarding flow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Label</label>
              <Input
                placeholder={formType === 'ROLE' ? 'e.g. Design Engineer' : 'e.g. Scaling UX systems'}
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
              />
            </div>

            {formType === 'ROLE' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Card Icon</label>
                <Select value={formIcon} onValueChange={setFormIcon}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((i) => (
                      <SelectItem key={i.name} value={i.name}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Display Sort Order</label>
              <Input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOption} disabled={isSaving || !formLabel.trim()}>
              {isSaving ? 'Saving...' : 'Save Option'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Main>
  </>
  )
}
