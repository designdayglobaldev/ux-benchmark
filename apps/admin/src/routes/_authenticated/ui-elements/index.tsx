import { createFileRoute } from '@tanstack/react-router'
import { UiElements } from '@/features/ui-elements'

export const Route = createFileRoute('/_authenticated/ui-elements/')({
  component: UiElements,
})
