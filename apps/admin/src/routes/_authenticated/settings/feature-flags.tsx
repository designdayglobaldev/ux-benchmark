import { createFileRoute } from '@tanstack/react-router'
import { FeatureFlagsSettings } from '@/features/settings/feature-flags'

export const Route = createFileRoute('/_authenticated/settings/feature-flags')({
  component: FeatureFlagsSettings,
})
