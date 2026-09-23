import { z } from 'zod'

export const siteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  url: z.string().optional(),
  userName: z.string().min(1, 'User name is required'),
  password: z.string().min(1, 'Password is required'),
})

export type SiteFormData = z.infer<typeof siteSchema>
