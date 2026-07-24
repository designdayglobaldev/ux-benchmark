import { createFileRoute } from '@tanstack/react-router'
import { UiElementDetail } from '@/features/ui-elements/components/ui-element-detail'

export const Route = createFileRoute('/_authenticated/ui-elements/$elementId')({
  component: UiElementDetail,
})
