import { createFileRoute } from '@tanstack/react-router'
import { PatternDetail } from '@/features/patterns/components/pattern-detail'

export const Route = createFileRoute('/_authenticated/patterns/$patternId/')({
  component: PatternDetail,
})
