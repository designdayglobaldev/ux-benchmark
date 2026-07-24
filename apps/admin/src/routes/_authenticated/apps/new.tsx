import { createFileRoute } from '@tanstack/react-router'
import { AppForm } from '@/features/apps/components/app-form'

export const Route = createFileRoute('/_authenticated/apps/new')({
  component: AppForm,
})
