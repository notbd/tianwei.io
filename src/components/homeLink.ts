import { cn } from '@/lib/utils'

/** The home page's link look, shared by its external links and its post links. */
export const homeLinkClassName = cn(
  'text-zinc-600 hover:text-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100',
  // color only: transition-colors would also fade the focus ring in
  'transition-[color] duration-200',
  'underline',
)
