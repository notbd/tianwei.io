import { z } from 'zod'

export const postSchema = z.object({
  id: z.number(),
  slug: z.string(),
  category: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  author: z.string(),
  createdAt: z.coerce.date(),
  // nullable-first check: coercion never sees the null
  updatedAt: z.coerce.date().nullable(),
  isPublished: z.boolean(),
  content: z.string(),
})

export const postSummarySchema = postSchema.omit({
  content: true,
  isPublished: true,
})

export type Post = z.infer<typeof postSchema>
export type PostSummary = z.infer<typeof postSummarySchema>
