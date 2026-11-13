import type { z } from 'zod'
import Link from 'next/link'
import { PROSE_LINK } from '@/components/mdx/proseLink'
import { linkAttributesSchema } from '@/components/mdx/schemas'

type MdxLinkProps = z.input<typeof linkAttributesSchema> & { children?: React.ReactNode }

/** A post's internal link (<Link href="/posts">), styled like a Markdown link. */
export function MdxLink({ children, ...attributes }: MdxLinkProps) {
  const { href } = linkAttributesSchema.parse(attributes)
  return (
    <Link
      href={href}
      className={PROSE_LINK}
    >
      {children}
    </Link>
  )
}
