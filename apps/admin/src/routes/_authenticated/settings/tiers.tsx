import { createFileRoute } from '@tanstack/react-router'
import { TierConfig } from '@/features/settings/tier-config'

export const Route = createFileRoute('/_authenticated/settings/tiers')({
  component: TierConfig,
})
