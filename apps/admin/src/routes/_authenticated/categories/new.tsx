import { createFileRoute } from '@tanstack/react-router'
import { CategoryForm } from '@/features/categories/components/category-form'

export const Route = createFileRoute('/_authenticated/categories/new')({
  component: CategoryForm,
})
