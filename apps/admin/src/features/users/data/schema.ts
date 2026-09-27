import { z } from 'zod'

const userTierSchema = z.union([
  z.literal('FREE'),
  z.literal('PREMIUM'),
])
export type UserTier = z.infer<typeof userTierSchema>

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('admin'),
  z.literal('superadmin'),
  z.literal('manager'),
  z.literal('cashier'),
])
export type UserRole = z.infer<typeof userRoleSchema>

const _userSchema = z.object({
  id: z.string(),
  email: z.string(),
  tier: userTierSchema.optional(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  phoneNumber: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  usages: z.array(
    z.object({
      id: z.string(),
      month: z.number(),
      year: z.number(),
      promptsUsed: z.number(),
    })
  ).optional(),
})
export type User = z.infer<typeof _userSchema>
