import { createFileRoute } from '@tanstack/react-router'
import { Patterns } from '@/features/patterns'

export const Route = createFileRoute('/_authenticated/patterns/')({
  component: Patterns,
})
