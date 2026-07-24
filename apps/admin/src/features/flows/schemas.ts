import { z } from 'zod'

export const flowSchema = z.object({
  name: z.string().min(1, 'Flow name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'LIVE']).default('DRAFT'),
})

export type FlowFormValues = z.infer<typeof flowSchema>
