import type { ComponentProps } from 'react'
import { homeLinkClassName } from '@/components/homeLink'
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
      className={cn(homeLinkClassName, className)}
    >
      {children}
    </a>
  )
}
