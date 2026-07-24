import * as z from 'zod';

export const patternSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'LIVE']),
});

export type PatternFormValues = z.infer<typeof patternSchema>;
