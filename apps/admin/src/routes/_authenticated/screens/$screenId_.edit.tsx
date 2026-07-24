import { createFileRoute } from '@tanstack/react-router'
import { ScreenForm } from '@/features/screens/components/screen-form'

export const Route = createFileRoute('/_authenticated/screens/$screenId_/edit')({
  component: EditScreenRoute,
})

function EditScreenRoute() {
  const { screenId } = Route.useParams()
  return <ScreenForm screenId={screenId} />
}
