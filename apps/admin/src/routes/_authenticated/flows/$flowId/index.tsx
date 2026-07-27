import { createFileRoute } from '@tanstack/react-router'
import { FlowDetail } from '@/features/flows/components/flow-detail'

export const Route = createFileRoute('/_authenticated/flows/$flowId/')({
  component: FlowDetail,
})
