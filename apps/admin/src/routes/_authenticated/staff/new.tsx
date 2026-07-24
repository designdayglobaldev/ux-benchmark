import { createFileRoute } from '@tanstack/react-router'
import { StaffForm } from '@/features/staff/components/staff-form'

export const Route = createFileRoute('/_authenticated/staff/new')({
  component: StaffForm,
})
