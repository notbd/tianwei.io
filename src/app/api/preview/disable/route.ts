import type { NextRequest } from 'next/server'
import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

/** Exits draft mode and returns to the home page. */
export async function GET(request: NextRequest) {
  const draft = await draftMode()
  draft.disable()
  return NextResponse.redirect(new URL('/', request.url))
}
