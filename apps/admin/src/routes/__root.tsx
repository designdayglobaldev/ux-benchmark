import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'


import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'
import { AuthProvider } from '@/context/auth-context'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    return (
      <AuthProvider>
        <NavigationProgress />
        <Outlet />
        <Toaster duration={5000} />
      </AuthProvider>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
