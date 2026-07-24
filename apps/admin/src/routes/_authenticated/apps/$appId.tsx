import { createFileRoute } from '@tanstack/react-router'
import { AppDetailLayout } from '@/features/apps/components/app-detail'

export const Route = createFileRoute('/_authenticated/apps/$appId')({
  component: AppDetailLayout,
})
