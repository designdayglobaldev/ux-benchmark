import { createFileRoute } from '@tanstack/react-router'
import { SubcategoryDetail } from '@/features/subcategories/components/subcategory-detail'

export const Route = createFileRoute('/_authenticated/subcategories/$subcategoryId/')({
  component: SubcategoryDetail,
})
