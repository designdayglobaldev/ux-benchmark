import { createFileRoute } from '@tanstack/react-router'
import { ScreenDetail } from '@/features/screens/components/screen-detail'

export const Route = createFileRoute('/_authenticated/screens/$screenId')({
  component: ScreenDetail,
})
