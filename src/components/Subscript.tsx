import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type SubscriptProps = ComponentProps<'span'> & { children: React.ReactNode }
type SubscriptBlockProps = ComponentProps<'div'> & { children: React.ReactNode }

export function Subscript({
  className,
  children,
  ...props
}: SubscriptProps) {
  return (
    <span
      {...props}
      className={cn('text-xs', className)}
    >
      {children}
    </span>
  )
}

export function SubscriptBlock({
  className,
  children,
  ...props
}:
SubscriptBlockProps) {
  return (
    <div
      {...props}
      className={cn('text-xs', className)}
    >
      {children}
    </div>
  )
}
