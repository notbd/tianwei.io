import { revalidateTag } from 'next/cache'
import { prefixWarmers, tagWarmers } from './warmers'

export type RevalidateResult = {
  success: boolean
  revalidated: string[]
  warmed?: string[]
  error?: string
}

/**
 * Warms cache for a given tag (exact match or prefix match)
 */
async function warmCacheForTag(tag: string): Promise<boolean> {
  // Check exact match first
  if (tagWarmers[tag]) {
    await tagWarmers[tag]()
    return true
  }

  // Check prefix matches
  for (const [prefix, warmer] of Object.entries(prefixWarmers)) {
    if (tag.startsWith(prefix)) {
      const id = tag.slice(prefix.length)
      await warmer(id)
      return true
    }
  }

  return false
}

/**
 * Revalidates cache for multiple tags (no warming)
 */
export async function revalidateTags(
  tags: string[],
): Promise<RevalidateResult> {
  const revalidated: string[] = []

  for (const tag of tags) {
    revalidateTag(tag, 'max')
    revalidated.push(tag)
  }

  return { success: true, revalidated }
}

/**
 * Revalidates and warms cache for multiple tags
 */
export async function revalidateAndWarmTags(
  tags: string[],
): Promise<RevalidateResult> {
  const revalidated: string[] = []
  const warmed: string[] = []

  for (const tag of tags) {
    revalidateTag(tag, 'max')
    revalidated.push(tag)

    const wasWarmed = await warmCacheForTag(tag)
    if (wasWarmed) {
      warmed.push(tag)
    }
  }

  return { success: true, revalidated, warmed }
}

/**
 * Revalidates a specific post by slug
 * Convenience function that handles both the post tag and list tag
 */
export async function revalidateAndWarmPost(slug: string): Promise<RevalidateResult> {
  return revalidateAndWarmTags([`post-${slug}`, 'posts'])
}
