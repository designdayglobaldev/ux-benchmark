import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { 
  Check, 
  RefreshCw, 
  CreditCard, 
  Users, 
  Receipt, 
  Sliders, 
  TrendingUp, 
  ShieldCheck, 
  DollarSign,
  Plus,
  Package
} from 'lucide-react'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1`

export function Billing() {
  const [rates, setRates] = useState<Record<string, number>>({
    WORKSPACE_CHAT: 10,
    BENCHMARK: 10,
    BENCHMARK_CHAT: 5,
    SCREEN_INSPECT: 5,
    SCREEN_INSIGHTS: 5,
    SCREEN_COMPARE: 8,
    DETECT_CONTEXT: 5,
    IMPROVE_DESIGN: 12,
    DESIGN_AGENT: 15,
  })
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [ledgerStats, setLedgerStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // New Plan form state
  const [newPlan, setNewPlan] = useState({
    code: '',
    name: '',
    description: '',
    amountInr: 1499,
    monthlyCredits: 1000,
    interval: 'monthly',
  })

  const fetchOverview = () => {
    fetch(`${API_URL}/admin/billing/overview`)
      .then(res => res.json())
      .then(data => {
        if (data.subscriptions) setSubscriptions(data.subscriptions)
        if (data.transactions) setTransactions(data.transactions)
        if (data.ledgerStats) setLedgerStats(data.ledgerStats)
        if (data.plans) setPlans(data.plans)
      })
      .catch(console.error)

    fetch(`${API_URL}/admin/billing/rate-card`)
      .then(res => res.json())
      .then(data => {
        if (data.rates) setRates(data.rates)
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/admin/billing/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan),
      })
      if (res.ok) {
        setMessage(`Successfully created & provisioned plan "${newPlan.name}"!`)
        fetchOverview()
        setNewPlan({
          code: '',
          name: '',
          description: '',
          amountInr: 1499,
          monthlyCredits: 1000,
          interval: 'monthly',
        })
        setTimeout(() => setMessage(''), 4000)
      } else {
        const err = await res.json()
        alert(err.message || 'Failed to create plan')
      }
    } catch (e: any) {
      alert(e.message || 'Error creating plan')
    }
    setLoading(false)
  }

  const handleUpdateRate = async (action: string, cost: number) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/admin/billing/rate-card`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, cost }),
      })
      if (res.ok) {
        const data = await res.json()
        setRates(data.rates)
        setMessage(`Successfully saved ${action} at ${cost} credits!`)
        setTimeout(() => setMessage(''), 4000)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const totalCapturedInr = transactions
    .filter(t => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + (t.amount || 0), 0) / 100

  const activeSubCount = subscriptions.filter(s => s.status === 'ACTIVE').length

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6 p-6 overflow-y-auto max-w-7xl mx-auto w-full'>
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Billing & Subscriptions</h1>
            <p className='text-muted-foreground mt-1'>
              Manage Razorpay e-mandates, captured transactions, AI credit pricing rate cards, and ledger telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchOverview} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </Button>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            {message}
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Subscriptions</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubCount} PRO</div>
              <p className="text-xs text-muted-foreground mt-1">
                AutoPay recurring billing active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Captured Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalCapturedInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {transactions.length} captured orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ledger Turnover</CardTitle>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ledgerStats?.totalTransactions || 0} Entries</div>
              <p className="text-xs text-muted-foreground mt-1">
                Double-entry tamper-proof audit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Gateway</CardTitle>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Razorpay
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Webhooks listening on /api/v1/billing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Suite */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="transactions" className="gap-2">
              <Receipt className="w-4 h-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <Package className="w-4 h-4" />
              Plans & AutoPay
            </TabsTrigger>
            <TabsTrigger value="rates" className="gap-2">
              <Sliders className="w-4 h-4" />
              AI Quotas
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: TRANSACTIONS TABLE */}
          <TabsContent value="transactions" className="pt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Payment Transactions</CardTitle>
                  <CardDescription>
                    Complete financial ledger of captured payments, invoices, and credit allocations.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono">
                  {transactions.length} Records
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto border-t">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="p-4">Customer</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Razorpay Payment ID</th>
                        <th className="p-4">Credits Granted</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No payment transactions recorded yet. When users subscribe or purchase credits via Razorpay, they will appear here in real-time.
                          </td>
                        </tr>
                      ) : (
                        transactions.map(t => (
                          <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="font-medium text-foreground">{t.user?.email || t.userId}</div>
                              {t.user?.name && <div className="text-xs text-muted-foreground">{t.user.name}</div>}
                            </td>
                            <td className="p-4 font-semibold text-foreground">
                              ₹{(t.amount / 100).toFixed(2)}
                            </td>
                            <td className="p-4 font-mono text-xs text-muted-foreground">
                              {t.razorpayPaymentId || 'N/A'}
                            </td>
                            <td className="p-4 font-medium text-emerald-500">
                              +{t.creditsGranted.toLocaleString()}
                            </td>
                            <td className="p-4">
                              <Badge 
                                variant={t.status === 'SUCCESS' ? 'default' : 'destructive'}
                                className={t.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
                              >
                                {t.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {new Date(t.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: SUBSCRIPTIONS TABLE */}
          <TabsContent value="subscriptions" className="pt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Customer Subscriptions</CardTitle>
                  <CardDescription>
                    Active recurring auto-debit mandates synchronized via Razorpay subscriptions.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono">
                  {subscriptions.length} Subscriptions
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto border-t">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="p-4">Customer</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Plan / Tier</th>
                        <th className="p-4">Razorpay Sub ID</th>
                        <th className="p-4">Valid Until</th>
                        <th className="p-4">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {subscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No recurring subscriptions found yet.
                          </td>
                        </tr>
                      ) : (
                        subscriptions.map(s => (
                          <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="font-medium text-foreground">{s.user?.name || 'Customer'}</div>
                              <div className="text-xs text-muted-foreground">{s.user?.email || s.userId}</div>
                            </td>
                            <td className="p-4">
                              <Badge 
                                variant={s.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className={s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}
                              >
                                {s.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <span className="text-xs font-bold tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">
                                PRO TIER
                              </span>
                            </td>
                            <td className="p-4 font-mono text-xs text-muted-foreground">
                              {s.razorpaySubId || 'N/A'}
                            </td>
                            <td className="p-4 text-xs font-medium">
                              {s.entitledUntil ? new Date(s.entitledUntil).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PLANS & AUTOPAY */}
          <TabsContent value="plans" className="pt-4">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Column: Form to create a new plan */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    Create Subscription Plan
                  </CardTitle>
                  <CardDescription>
                    Automatically provisions an AutoPay recurring plan on Razorpay and syncs it to the database.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePlan} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1 text-muted-foreground">
                        Plan Code
                      </label>
                      <Input
                        placeholder="e.g. pro, agency, team"
                        value={newPlan.code}
                        onChange={e => setNewPlan(p => ({ ...p, code: e.target.value.toLowerCase().trim() }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1 text-muted-foreground">
                        Plan Name
                      </label>
                      <Input
                        placeholder="e.g. Zibo Pro Monthly"
                        value={newPlan.name}
                        onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1 text-muted-foreground">
                        Price (INR ₹)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1499"
                        value={newPlan.amountInr}
                        onChange={e => setNewPlan(p => ({ ...p, amountInr: Number(e.target.value) }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1 text-muted-foreground">
                        Monthly AI Credits Included
                      </label>
                      <Input
                        type="number"
                        min="50"
                        placeholder="1000"
                        value={newPlan.monthlyCredits}
                        onChange={e => setNewPlan(p => ({ ...p, monthlyCredits: Number(e.target.value) }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1 text-muted-foreground">
                        Billing Interval
                      </label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        value={newPlan.interval}
                        onChange={e => setNewPlan(p => ({ ...p, interval: e.target.value }))}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-1 text-muted-foreground">
                        Description
                      </label>
                      <Input
                        placeholder="Brief summary of plan perks"
                        value={newPlan.description}
                        onChange={e => setNewPlan(p => ({ ...p, description: e.target.value }))}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating on Razorpay...' : 'Create & Sync Plan'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Right Column: Existing active plans list */}
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Active Subscription Plans</CardTitle>
                      <CardDescription>
                        Plans currently available for user checkout and recurring billing.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {plans.length} Configured
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto border-t">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <th className="p-4">Plan Name & Code</th>
                            <th className="p-4">Price (INR)</th>
                            <th className="p-4">Monthly Credits</th>
                            <th className="p-4">Razorpay Plan ID</th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {plans.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                No subscription plans configured yet.
                              </td>
                            </tr>
                          ) : (
                            plans.map(p => {
                              const price = p.prices?.[0]
                              return (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                  <td className="p-4">
                                    <div className="font-semibold text-foreground">{p.name}</div>
                                    <div className="font-mono text-xs text-muted-foreground">{p.code}</div>
                                  </td>
                                  <td className="p-4 font-semibold">
                                    {price ? `₹${(price.amountMinor / 100).toFixed(2)}` : 'N/A'}
                                  </td>
                                  <td className="p-4 font-medium text-emerald-500">
                                    {price ? `+${price.monthlyCredits.toLocaleString()} cr` : 'N/A'}
                                  </td>
                                  <td className="p-4 font-mono text-xs text-muted-foreground">
                                    {price?.razorpayPlanId || 'Pending'}
                                  </td>
                                  <td className="p-4">
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                      ACTIVE
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: AI QUOTA PRICING */}
          <TabsContent value="rates" className="pt-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">AI Credit Rate Card</h3>
                  <p className="text-sm text-muted-foreground">
                    Define dynamic credit deductions for every AI touchpoint across the user app.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(rates).map(([action, cost]) => (
                  <Card key={action} className="relative overflow-hidden hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold font-mono tracking-tight">{action}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {cost} cr
                        </Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-2">
                        {getActionDescription(action)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                            Cost (Credits)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="500"
                            defaultValue={cost}
                            className="h-9"
                            id={`input-${action}`}
                          />
                        </div>
                        <div className="pt-5">
                          <Button
                            size="sm"
                            disabled={loading}
                            onClick={() => {
                              const input = document.getElementById(`input-${action}`) as HTMLInputElement
                              if (input) handleUpdateRate(action, parseInt(input.value, 10))
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

function getActionDescription(action: string) {
  switch (action) {
    case 'WORKSPACE_CHAT': return 'AI research workspace multi-turn thread query'
    case 'BENCHMARK': return 'Full mobile UX screen benchmark teardown'
    case 'BENCHMARK_CHAT': return 'Follow-up interactive turn in benchmark view'
    case 'SCREEN_INSPECT': return 'Region coordinate vision inspect & analysis'
    case 'SCREEN_INSIGHTS': return 'Pattern and heuristic insights generation'
    case 'SCREEN_COMPARE': return 'Dual screen heuristic comparative analysis'
    case 'DETECT_CONTEXT': return 'Image context & category identification'
    case 'IMPROVE_DESIGN': return 'Generative HTML/Tailwind screen revision'
    case 'DESIGN_AGENT': return 'Design Agent Studio mobile canvas generation'
    default: return 'AI feature credit consumption'
  }
}
