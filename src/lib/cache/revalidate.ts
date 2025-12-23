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
  try {
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
  catch (error) {
    console.error(`Failed to warm cache for tag "${tag}":`, error)
    throw error // Re-throw to ensure we know if warming fails
  }
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
  const errors: string[] = []

  // Revalidate all tags first (synchronous)
  for (const tag of tags) {
    revalidateTag(tag, 'max')
    revalidated.push(tag)
  }

  // Warm cache for all tags in parallel
  // This ensures fresh data is fetched and cached before users visit
  // Parallel execution improves performance when warming multiple tags
  const warmingResults = await Promise.allSettled(
    tags.map(async (tag) => {
      try {
        const wasWarmed = await warmCacheForTag(tag)
        return { tag, wasWarmed, success: true }
      }
      catch (error) {
        const errorMsg = `Failed to warm tag "${tag}": ${error instanceof Error ? error.message : String(error)}`
        console.error(errorMsg)
        return { tag, wasWarmed: false, success: false, error: errorMsg }
      }
    }),
  )

  // Process results
  for (const result of warmingResults) {
    if (result.status === 'fulfilled') {
      if (result.value.wasWarmed) {
        warmed.push(result.value.tag)
      }
      if (!result.value.success && result.value.error) {
        errors.push(result.value.error)
      }
    }
    else {
      // Promise.allSettled shouldn't reject, but handle just in case
      errors.push(`Unexpected error warming tags: ${result.reason}`)
    }
  }

  return {
    success: errors.length === 0,
    revalidated,
    warmed,
    ...(errors.length > 0 && { error: errors.join('; ') }),
  }
}

/**
 * Revalidates a specific post by slug
 * Convenience function that handles both the post tag and list tag
 */
export async function revalidateAndWarmPost(slug: string): Promise<RevalidateResult> {
  return revalidateAndWarmTags([`post-${slug}`, 'posts'])
}
