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
        'text-zinc-600 hover:text-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100',
        'underline transition-colors duration-500',
        className,
      )}
    >
      {children}
    </a>
  )
}
