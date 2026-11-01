import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type ExternalLinkProps = ComponentProps<'a'> & {
  href: string
  children: React.ReactNode
}

export function ExternalLink({
  href,
  className,
  children,
  ...props
}: ExternalLinkProps) {
  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'text-zinc-600 hover:text-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100',
        // color only: transition-colors would also fade the focus ring in
        'transition-[color] duration-200',
        'underline',
        className,
      )}
    >
      {children}
    </a>
  )
}
