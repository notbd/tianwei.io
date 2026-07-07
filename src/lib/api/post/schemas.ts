import { z } from 'zod'

export const postSchema = z.object({
  id: z.number(),
  slug: z.string(),
  category: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  author: z.string(),
  createdAt: z.coerce.date(),
  // optional so the frontend tolerates an API that predates the field
  // (nullable-first check: coercion never sees the null)
  updatedAt: z.coerce.date().nullable().optional(),
  isPublished: z.boolean(),
  content: z.string(),
})

export const postSummarySchema = postSchema.omit({
  content: true,
  isPublished: true,
})

export type Post = z.infer<typeof postSchema>
export type PostSummary = z.infer<typeof postSummarySchema>
