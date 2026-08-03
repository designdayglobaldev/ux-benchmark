import { createFileRoute } from '@tanstack/react-router'
import { CategoryDetail } from '@/features/categories/components/category-detail'

export const Route = createFileRoute('/_authenticated/categories/$categoryId/')({
  component: CategoryDetail,
})
