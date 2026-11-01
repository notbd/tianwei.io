import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: React.ReactNode
  /** Lines under the title: a description, counts, navigation. */
  children?: React.ReactNode
  className?: string
}

/** Title block shared by the listing pages and the not-found page. */
export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-12 border-b border-zinc-200/30 pb-4 dark:border-zinc-800/30', className)}>
      <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h1>
      {children}
    </header>
  )
}
