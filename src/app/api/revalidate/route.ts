import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { POSTS_TAG } from '@/lib/api'
import { revalidatePosts } from '@/lib/cache'
import { secureEquals } from '@/lib/secureCompare'

// Room for the API reads, then the expiry. A hung API fails the first read,
// retries included, in about 30 s; reads that are only slow get the rest.
export const maxDuration = 60

// The one body the content engine's deploy sends; anything else is a 400.
const revalidateBodySchema = z.strictObject({
  tags: z.tuple([
    z.literal(POSTS_TAG),
  ]),
})

/**
 * Called by the content engine's deploy after a sync. 401 without the
 * bearer, 400 for any other body, 502 when the API read before the expiry
 * failed (nothing was expired), 200 once the `posts` tag is expired.
 */
export async function POST(request: NextRequest) {
  // Fail CLOSED on missing configuration: the old interpolated comparison
  // made an unset secret match the literal header "Bearer undefined".
  const secret = process.env.REVALIDATION_SECRET
  if (secret === undefined || secret === '') {
    console.error('REVALIDATION_SECRET is not configured: rejecting revalidation request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = request.headers.get('authorization') ?? ''
  if (!secureEquals(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // an unparsable or invalid body is the caller's error
  if (!revalidateBodySchema.safeParse(await request.json().catch(() => undefined)).success) {
    return NextResponse.json(
      { error: `Expected the body { "tags": ["${POSTS_TAG}"] }` },
      { status: 400 },
    )
  }

  const result = await revalidatePosts()
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Could not read the content API; nothing was revalidated', message: result.message },
      { status: 502 },
    )
  }

  // the 2026-07 content engine checks `success`, the current one `revalidated`
  return NextResponse.json({
    success: true,
    revalidated: [POSTS_TAG],
  })
}
