import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1`

export function TierConfig() {
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
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/admin/billing/rate-card`)
      .then(res => res.json())
      .then(data => {
        if (data.rates) setRates(data.rates)
      })
      .catch(console.error)
  }, [])

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
        setMessage(`Saved ${action} at ${cost} credits!`)
        setTimeout(() => setMessage(''), 4000)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className='flex flex-1 flex-col space-y-6 max-w-4xl overflow-y-auto pb-12'>
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>AI Quota Pricing</h2>
          <p className='text-sm text-muted-foreground'>
            Configure default credit deduction cost per AI capability.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link to="/billing">
            Open Full Billing Center
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(rates).map(([action, cost]) => (
          <Card key={action}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold font-mono">{action}</CardTitle>
                <Badge variant="outline">{cost} cr</Badge>
              </div>
              <CardDescription className="text-xs">
                {getActionDescription(action)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="500"
                    defaultValue={cost}
                    id={`setting-input-${action}`}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={loading}
                  onClick={() => {
                    const el = document.getElementById(`setting-input-${action}`) as HTMLInputElement
                    if (el) handleUpdateRate(action, parseInt(el.value, 10))
                  }}
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
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
