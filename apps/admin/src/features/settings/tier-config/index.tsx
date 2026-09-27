import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1`

export function TierConfig() {
  const [freeLimit, setFreeLimit] = useState<number>(10)
  const [premiumLimit, setPremiumLimit] = useState<number>(100)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/config/tiers`)
      .then(res => res.json())
      .then(data => {
        const free = data.find((t: any) => t.tier === 'FREE')
        const premium = data.find((t: any) => t.tier === 'PREMIUM')
        if (free) setFreeLimit(free.monthlyPromptLimit)
        if (premium) setPremiumLimit(premium.monthlyPromptLimit)
      })
      .catch(console.error)
  }, [])

  const handleSave = async (tier: 'FREE' | 'PREMIUM', limit: number) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/config/tiers/${tier}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyPromptLimit: limit }),
      })
      if (res.ok) {
        setMessage(`${tier} tier updated successfully!`)
      } else {
        setMessage(`Failed to update ${tier} tier.`)
      }
    } catch (error) {
      console.error(error)
      setMessage('An error occurred.')
    }
    setLoading(false)
  }

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>AI Quota Configurations</h3>
        <p className='text-sm text-muted-foreground'>
          Set the monthly prompt limits for different user tiers.
        </p>
      </div>
      
      {message && <div className="text-sm font-medium text-green-500">{message}</div>}

      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Free Tier</CardTitle>
            <CardDescription>Default limit for new and free users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Monthly Prompt Limit</Label>
              <Input 
                type="number" 
                value={freeLimit} 
                onChange={e => setFreeLimit(Number(e.target.value))} 
              />
            </div>
            <Button 
              onClick={() => handleSave('FREE', freeLimit)} 
              disabled={loading}
            >
              Save Free Limit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Premium Tier</CardTitle>
            <CardDescription>Limit for premium subscribers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Monthly Prompt Limit</Label>
              <Input 
                type="number" 
                value={premiumLimit} 
                onChange={e => setPremiumLimit(Number(e.target.value))} 
              />
            </div>
            <Button 
              onClick={() => handleSave('PREMIUM', premiumLimit)} 
              disabled={loading}
            >
              Save Premium Limit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
