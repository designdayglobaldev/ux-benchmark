import { createFileRoute } from '@tanstack/react-router'
import { Waitlist } from '@/features/waitlist'

export const Route = createFileRoute('/_authenticated/users/')({
  component: Waitlist,
})
