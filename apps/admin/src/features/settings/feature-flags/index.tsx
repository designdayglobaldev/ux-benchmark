import { useEffect, useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, RefreshCw, CheckCircle2, Save, Sparkles, Wrench, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1`

type FeatureBehavior = 'hide' | 'maintenance' | 'coming_soon'

interface FeatureFlag {
  key: string
  name: string
  description: string
  enabled: boolean
  behavior: FeatureBehavior
  customMessage: string
  source?: string
}

export function FeatureFlagsSettings() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const fetchFlags = async () => {
    setLoading(true)
    setStatusMessage(null)
    try {
      const res = await fetch(`${API_URL}/feature-flags`)
      if (res.ok) {
        const data = await res.json()
        setFlags(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlags()
  }, [])

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    setUpdatingKey(key)
    setStatusMessage(null)
    const newStatus = !currentEnabled

    // Optimistic UI update
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: newStatus } : f))
    )

    try {
      const res = await fetch(`${API_URL}/feature-flags/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newStatus }),
      })

      if (res.ok) {
        setStatusMessage(`Feature "${key}" turned ${newStatus ? 'ON (Live)' : 'OFF'}`)
      } else {
        // Revert on error
        setFlags((prev) =>
          prev.map((f) => (f.key === key ? { ...f, enabled: currentEnabled } : f))
        )
        setStatusMessage(`Failed to update "${key}"`)
      }
    } catch (error) {
      console.error(error)
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? { ...f, enabled: currentEnabled } : f))
      )
      setStatusMessage(`Error updating flag "${key}"`)
    } finally {
      setUpdatingKey(null)
    }
  }

  const handleSaveConfig = async (key: string, behavior: FeatureBehavior, customMessage: string) => {
    setSavingKey(key)
    setStatusMessage(null)

    try {
      const res = await fetch(`${API_URL}/feature-flags/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ behavior, customMessage }),
      })

      if (res.ok) {
        setStatusMessage(`Settings saved for "${key}"`)
      } else {
        setStatusMessage(`Failed to save settings for "${key}"`)
      }
    } catch (error) {
      console.error(error)
      setStatusMessage(`Error saving settings for "${key}"`)
    } finally {
      setSavingKey(null)
    }
  }

  const handleFieldChange = (key: string, field: 'behavior' | 'customMessage', value: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, [field]: value } : f))
    )
  }

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-medium'>Feature Flags & Release Mode</h3>
          <p className='text-sm text-muted-foreground'>
            Control feature visibility, maintenance mode, or coming soon placeholders with custom messages.
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={fetchFlags}
          disabled={loading}
          className='gap-2'
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {statusMessage && (
        <div className='flex items-center gap-2 p-3 text-sm bg-primary/10 border border-primary/20 text-primary rounded-lg animate-in fade-in'>
          <CheckCircle2 className='h-4 w-4 shrink-0' />
          <span>{statusMessage}</span>
        </div>
      )}

      {loading && flags.length === 0 ? (
        <div className='flex items-center justify-center p-12'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
        </div>
      ) : (
        <div className='grid gap-6'>
          {flags.map((flag) => (
            <Card key={flag.key} className='border-border/60 bg-card/60 backdrop-blur-sm shadow-sm'>
              <CardHeader className='flex flex-row items-center justify-between pb-3'>
                <div className='space-y-1 pr-6'>
                  <div className='flex items-center gap-2'>
                    <CardTitle className='text-base'>{flag.name}</CardTitle>
                    <Badge variant='outline' className='text-[10px] font-mono'>
                      {flag.key}
                    </Badge>
                    {flag.source === 'posthog' && (
                      <Badge variant='secondary' className='text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20'>
                        PostHog Synced
                      </Badge>
                    )}
                  </div>
                  <CardDescription className='text-xs leading-relaxed'>
                    {flag.description}
                  </CardDescription>
                </div>
                <div className='flex items-center gap-3 shrink-0'>
                  {updatingKey === flag.key ? (
                    <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                  ) : (
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={() => handleToggle(flag.key, flag.enabled)}
                      aria-label={`Toggle ${flag.name}`}
                    />
                  )}
                  <span className={`text-xs font-semibold w-10 ${flag.enabled ? 'text-green-400' : 'text-amber-400'}`}>
                    {flag.enabled ? 'LIVE' : 'OFF'}
                  </span>
                </div>
              </CardHeader>

              {/* OFF Configuration: Behavior & Custom Message */}
              {!flag.enabled && (
                <CardContent className='pt-2 pb-4 border-t border-border/40 space-y-4 bg-muted/20 rounded-b-lg'>
                  <div className='space-y-2'>
                    <Label className='text-xs font-semibold text-muted-foreground'>
                      When OFF, what should users see?
                    </Label>
                    <RadioGroup
                      value={flag.behavior || 'coming_soon'}
                      onValueChange={(val) => handleFieldChange(flag.key, 'behavior', val)}
                      className='grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1'
                    >
                      <div className='flex items-center space-x-2 border border-border/60 rounded-md p-2.5 bg-background/50 hover:bg-background cursor-pointer'>
                        <RadioGroupItem value='coming_soon' id={`${flag.key}-coming-soon`} />
                        <Label htmlFor={`${flag.key}-coming-soon`} className='text-xs flex items-center gap-1.5 cursor-pointer font-medium'>
                          <Sparkles className='h-3.5 w-3.5 text-purple-400' />
                          Coming Soon
                        </Label>
                      </div>

                      <div className='flex items-center space-x-2 border border-border/60 rounded-md p-2.5 bg-background/50 hover:bg-background cursor-pointer'>
                        <RadioGroupItem value='maintenance' id={`${flag.key}-maintenance`} />
                        <Label htmlFor={`${flag.key}-maintenance`} className='text-xs flex items-center gap-1.5 cursor-pointer font-medium'>
                          <Wrench className='h-3.5 w-3.5 text-amber-400' />
                          Under Maintenance
                        </Label>
                      </div>

                      <div className='flex items-center space-x-2 border border-border/60 rounded-md p-2.5 bg-background/50 hover:bg-background cursor-pointer'>
                        <RadioGroupItem value='hide' id={`${flag.key}-hide`} />
                        <Label htmlFor={`${flag.key}-hide`} className='text-xs flex items-center gap-1.5 cursor-pointer font-medium'>
                          <EyeOff className='h-3.5 w-3.5 text-red-400' />
                          Hide completely
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {flag.behavior !== 'hide' && (
                    <div className='space-y-1.5'>
                      <Label htmlFor={`${flag.key}-msg`} className='text-xs text-muted-foreground'>
                        Custom Message displayed to users
                      </Label>
                      <div className='flex items-center gap-2'>
                        <Input
                          id={`${flag.key}-msg`}
                          value={flag.customMessage || ''}
                          onChange={(e) => handleFieldChange(flag.key, 'customMessage', e.target.value)}
                          placeholder='e.g., We are working on this feature! Coming back soon.'
                          className='text-xs h-9 bg-background/80'
                        />
                        <Button
                          size='sm'
                          className='h-9 gap-1.5 shrink-0 text-xs'
                          disabled={savingKey === flag.key}
                          onClick={() => handleSaveConfig(flag.key, flag.behavior, flag.customMessage)}
                        >
                          {savingKey === flag.key ? (
                            <Loader2 className='h-3.5 w-3.5 animate-spin' />
                          ) : (
                            <Save className='h-3.5 w-3.5' />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
