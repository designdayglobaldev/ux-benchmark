import { createFileRoute } from '@tanstack/react-router'
import { ScreenForm } from '@/features/screens/components/screen-form'

type ScreenSearch = {
  appId?: string
}

export const Route = createFileRoute('/_authenticated/screens/new')({
  validateSearch: (search: Record<string, unknown>): ScreenSearch => {
    return {
      appId: search.appId as string | undefined,
    }
  },
  component: NewScreenComponent,
})

function NewScreenComponent() {
  const search = Route.useSearch()
  return <ScreenForm initialAppId={search.appId} />
}
