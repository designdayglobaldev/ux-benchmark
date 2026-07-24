import { createFileRoute } from '@tanstack/react-router'
import { FlowForm } from '@/features/flows/components/flow-form'

export const Route = createFileRoute('/_authenticated/flows/new')({
  component: FlowForm,
})
