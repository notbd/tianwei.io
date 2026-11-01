import type { ComponentProps } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Quiet in-text link for secondary lines (post meta, page subtitles). */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn(
        'underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700',
        'dark:decoration-zinc-700 dark:hover:text-zinc-300',
        className,
      )}
    />
  )
}
