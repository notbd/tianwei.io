import type { NextRequest } from 'next/server'
import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

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
  if (expected === undefined || expected === '' || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (slug === null || slug === '') {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  const draft = await draftMode()
  draft.enable()

  return NextResponse.redirect(new URL(`/posts/${slug}`, request.url))
}
