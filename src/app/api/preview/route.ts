import type { NextRequest } from 'next/server'
import { draftMode } from 'next/headers'
import { after, NextResponse } from 'next/server'
import { BASE_URL } from '@/lib/api/config'
import { secureEquals } from '@/lib/secureCompare'

/**
 * Enables Next.js draft mode and redirects to the requested post.
 * Usage: /api/preview?secret=<PREVIEW_SECRET>&slug=<post-slug>
 *
 * With the draft cookie set, the post page bypasses the static cache and
 * fetches through the API's secret-protected preview endpoint, so
 * unpublished posts render for the author only.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const slug = request.nextUrl.searchParams.get('slug')

  const expected = process.env.PREVIEW_SECRET
  if (expected === undefined || expected === '' || secret === null || !secureEquals(secret, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (slug === null || slug === '') {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  // Pre-warm the database while the redirect + page render are in flight:
  // this is the one path where a human waits on a possibly-suspended Neon
  // compute, and it only fires AFTER authentication (no public wake lever).
  // Best-effort by design — see docs/adr/0005-no-speculative-db-warming.md.
  after(async () => {
    try {
      await fetch(`${BASE_URL}/api/categories`, { cache: 'no-store' })
    }
    catch {
      // the actual preview fetch has its own retry; a failed warm is noise
    }
  })

  const draft = await draftMode()
  draft.enable()

  return NextResponse.redirect(new URL(`/posts/${slug}`, request.url))
}
