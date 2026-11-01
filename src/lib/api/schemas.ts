import { z } from 'zod'

// The content API's wire contract: rows of the `posts` table, camelCased,
// dates as ISO strings. Unknown keys are stripped, so an additive API
// change never breaks a build; a missing or mistyped key fails loudly.

export const postSchema = z.object({
  id: z.number(),
  slug: z.string(),
  category: z.string(),
  title: z.string(),
  // an empty description means none, so readers only ever check for null
  description: z.string().nullable().transform(description => description === ''
    ? null
    : description),
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

// Response envelopes: `{ status: 'success', data }`, lists add `count`,
// failures are `{ status: 'error', message }`.

export function successEnvelope<T extends z.ZodType>(data: T) {
  return z.object({
    status: z.literal('success'),
    data,
  })
}

export function listEnvelope<T extends z.ZodType>(item: T) {
  return z.object({
    status: z.literal('success'),
    count: z.number(),
    data: z.array(item),
  })
}

export const errorEnvelope = z.object({
  status: z.literal('error'),
  message: z.string(),
})
