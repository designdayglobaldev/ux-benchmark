import { createFileRoute } from '@tanstack/react-router'
import { Screens } from '@/features/screens'
import { z } from 'zod'

const searchSchema = z.object({
  filter: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/screens/')({
  component: Screens,
  validateSearch: searchSchema,
})
