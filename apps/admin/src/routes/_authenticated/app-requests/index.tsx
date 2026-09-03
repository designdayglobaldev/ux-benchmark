import { createFileRoute } from '@tanstack/react-router'
import { AppRequests } from '@/features/app-requests'

export const Route = createFileRoute('/_authenticated/app-requests/')({
  component: AppRequests,
})
