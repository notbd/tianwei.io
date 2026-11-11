import type { z } from 'zod'
import Link from 'next/link'
import { linkAttributesSchema } from '@/components/mdx/schemas'
import { cn } from '@/lib/utils'

type MdxLinkProps = z.input<typeof linkAttributesSchema> & { children?: React.ReactNode }

/** A post's internal link (<Link href="/posts">), styled like a Markdown link. */
export function MdxLink({ children, ...attributes }: MdxLinkProps) {
  const { href } = linkAttributesSchema.parse(attributes)
  return (
    <Link
      href={href}
      className={cn(
        'text-teal-700 hover:text-teal-600 dark:text-teal-600 dark:hover:text-teal-500',
        'transition-[color] duration-200 font-medium underline underline-offset-4',
      )}
    >
      {children}
    </Link>
  )
}
