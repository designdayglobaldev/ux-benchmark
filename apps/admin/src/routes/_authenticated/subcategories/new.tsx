import { createFileRoute } from '@tanstack/react-router'
import { SubcategoryForm } from '@/features/subcategories/components/subcategory-form'

export const Route = createFileRoute('/_authenticated/subcategories/new')({
  component: SubcategoryForm,
})
