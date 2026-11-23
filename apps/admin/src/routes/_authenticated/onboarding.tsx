import { createFileRoute } from '@tanstack/react-router'
import OnboardingFeature from '@/features/onboarding'

export const Route = createFileRoute('/_authenticated/onboarding')({
  component: OnboardingFeature,
})
