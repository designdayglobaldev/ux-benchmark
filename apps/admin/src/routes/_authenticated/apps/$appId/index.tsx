import { createFileRoute } from '@tanstack/react-router'
import { AppOverview } from '@/features/apps/components/app-overview'

export const Route = createFileRoute('/_authenticated/apps/$appId/')({
  component: AppOverview,
})
