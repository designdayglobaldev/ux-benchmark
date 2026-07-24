import { createFileRoute } from '@tanstack/react-router'
import { UiElementForm } from '@/features/ui-elements/components/ui-element-form'

export const Route = createFileRoute('/_authenticated/ui-elements/$elementId/edit')({
  component: UiElementForm,
})
