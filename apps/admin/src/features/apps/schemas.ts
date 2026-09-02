import { z } from 'zod'

export const appSchema = z.object({
  name: z.string().min(1, 'App name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional().or(z.literal('')),
  sourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'LIVE']).default('DRAFT'),
  isStaffPick: z.boolean().default(false),
  
  platform: z.array(z.string()).min(1, 'Select at least one platform'),
  market: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  palette: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),

  appLogo: z.union([z.instanceof(File), z.string()]).optional().refine((val) => val !== undefined && val !== '', 'Logo is required'),
  appThumbnail: z.union([z.instanceof(File), z.string()]).optional().refine((val) => val !== undefined && val !== '', 'Thumbnail is required'),

  // Visuals - UI
  visualUiTypography: z.string().min(1, 'Typography is required'),
  visualUiShape: z.string().min(1, 'Shape is required'),
  visualUiImagery: z.string().min(1, 'Imagery is required'),

  // Experience - UX
  experienceUxSolves: z.string().min(1, 'What it solves is required'),
  experienceUxOverall: z.string().min(1, 'Overall experience is required'),
  experienceUxTone: z.string().min(1, 'Tone is required'),

  // Tag arrays and text
  lookAndFeelTags: z.array(z.string()).optional(),
  lookAndFeelText: z.string().optional(),
  
  easeOfUseTags: z.array(z.string()).optional(),
  easeOfUseText: z.string().optional(),
  
  contentClarityTags: z.array(z.string()).optional(),
  contentClarityText: z.string().optional(),
  contentClarityQuoteTitle: z.string().optional(),
  contentClarityQuoteText: z.string().optional(),
  
  trustTags: z.array(z.string()).optional(),
  trustText: z.string().optional(),
  
  accessibilityTags: z.array(z.string()).optional(),
  accessibilityText: z.string().optional(),
  accessibilityUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  
  takeawayTags: z.array(z.string()).optional(),
  takeawayText: z.string().optional(),
})

export type AppFormValues = z.infer<typeof appSchema>
