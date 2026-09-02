import { z } from 'zod'

export const subcategorySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'LIVE']),
  categoryId: z.string().min(1, 'Category is required'),
})

export type SubcategoryFormValues = z.infer<typeof subcategorySchema>
