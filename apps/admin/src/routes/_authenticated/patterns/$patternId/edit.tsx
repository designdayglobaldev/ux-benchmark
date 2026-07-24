import { createFileRoute } from '@tanstack/react-router'
import { PatternForm } from '@/features/patterns/components/pattern-form'

export const Route = createFileRoute('/_authenticated/patterns/$patternId/edit')({
  component: PatternForm,
})
