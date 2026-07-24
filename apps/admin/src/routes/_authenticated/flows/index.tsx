import { createFileRoute } from '@tanstack/react-router'
import { Flows } from '@/features/flows'
import { z } from 'zod'

const searchSchema = z.object({
  filter: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/flows/')({
  component: Flows,
  validateSearch: searchSchema,
})
