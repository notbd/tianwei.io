import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidateAndWarmTags } from '@/lib/cache'
import { secureEquals } from '@/lib/secureCompare'

const revalidateBodySchema = z.object({
  tag: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  slug: z.string().min(1).optional(),
})

export async function POST(request: NextRequest) {
  // Fail CLOSED on missing configuration: the old interpolated comparison
  // made an unset secret match the literal header "Bearer undefined".
  const secret = process.env.REVALIDATION_SECRET
  if (secret === undefined || secret === '') {
    console.error('REVALIDATION_SECRET is not configured — rejecting revalidation request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = request.headers.get('authorization') ?? ''
  if (!secureEquals(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const parsedBody = revalidateBodySchema.safeParse(await request.json())
    const { tag, tags, slug }: z.infer<typeof revalidateBodySchema> = parsedBody.success ? parsedBody.data : {}

    // { slug } refreshes that post plus the list; { tags } and { tag } pass through
    const tagList = slug !== undefined
      ? [`post-${slug}`, 'posts']
      : tags ?? (tag !== undefined ? [tag] : undefined)
    if (tagList === undefined) {
      return NextResponse.json(
        { error: 'Missing tag, tags, or slug' },
        { status: 400 },
      )
    }

    const result = await revalidateAndWarmTags(tagList)
    // 207 Multi-Status: tags were revalidated but warming did not fully succeed
    return NextResponse.json(result, { status: result.success ? 200 : 207 })
  }
  catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
