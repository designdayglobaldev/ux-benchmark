import { z } from 'zod'

export const screenSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  appId: z.string().min(1, 'App is required'),
  flowId: z.string().optional().nullable(),
  screenNo: z.string().optional().nullable(),
  imageUrl: z.any().refine((val) => val, 'Image is required'),
  uxAnalysis: z.string().optional().nullable(),
  tonalityAndContent: z.string().optional().nullable(),
  keyHighlights: z.string().optional().nullable(),
  evidenceWhoWhy: z.string().optional().nullable(),
  whereToUse: z.string().optional().nullable(),
  whereNotToUse: z.string().optional().nullable(),
  similarApps: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'LIVE']).default('DRAFT'),
  uiElementIds: z.array(z.string()).default([]),
  patternIds: z.array(z.string()).default([]),
})

export type ScreenFormValues = z.infer<typeof screenSchema>
