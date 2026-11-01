import { revalidateTag } from 'next/cache'
import { prefixWarmers, tagWarmers } from './warmers'

export type RevalidateResult = {
  success: boolean
  revalidated: string[]
  warmed?: string[]
  error?: string
}

/**
 * Re-fetches a tag's data through the API (exact or prefix match).
 * Resolves false when no warmer knows the tag; rejects when warming fails.
 */
async function warmCacheForTag(tag: string): Promise<boolean> {
  // Check exact match first
  const exactWarmer = tagWarmers[tag]
  if (exactWarmer !== undefined) {
    await exactWarmer()
    return true
  }

  // Check prefix matches
  for (const [prefix, warmer] of Object.entries(prefixWarmers)) {
    if (tag.startsWith(prefix)) {
      await warmer(tag.slice(prefix.length))
      return true
    }
  }

  return false
}

/**
 * Expires the tags, then re-fetches their data through the API
 */
export async function revalidateAndWarmTags(
  tags: string[],
): Promise<RevalidateResult> {
  // Revalidate all tags first (synchronous). `{ expire: 0 }` expires the
  // tagged entries outright once this handler returns, so the next request
  // blocks on a fresh render instead of being served the previous version
  // (the 'max' profile is stale-while-revalidate). This is the documented
  // choice for invalidations that arrive through a webhook-style Route
  // Handler: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
  for (const tag of tags)
    revalidateTag(tag, { expire: 0 })

  // Re-fetch every tag through the API in parallel: the end-to-end check
  // that the API serves the synced content. Next applies the expiry only
  // after this handler returns, so these writes expire too and the first
  // render of each page fetches again. A failed re-fetch is reported, not
  // thrown: the route turns it into a 207 that fails the content deploy.
  const warmed: string[] = []
  const errors: string[] = []
  await Promise.all(tags.map(async (tag) => {
    try {
      if (await warmCacheForTag(tag))
        warmed.push(tag)
    }
    catch (error) {
      const message = error instanceof Error
        ? error.message
        : String(error)
      errors.push(`Failed to warm tag "${tag}": ${message}`)
    }
  }))
  if (errors.length > 0)
    console.error(errors.join('; '))

  return {
    success: errors.length === 0,
    revalidated: tags,
    warmed,
    ...(errors.length > 0 && {
      error: errors.join('; '),
    }),
  }
}
