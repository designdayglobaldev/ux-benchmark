import { createFileRoute } from '@tanstack/react-router'
import { Subcategories } from '@/features/subcategories'

export const Route = createFileRoute('/_authenticated/subcategories/')({
  component: Subcategories,
})
