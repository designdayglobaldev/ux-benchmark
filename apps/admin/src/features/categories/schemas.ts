import { z } from 'zod'

export const categorySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'LIVE']),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
