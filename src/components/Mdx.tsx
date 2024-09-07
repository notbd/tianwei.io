import * as React from 'react'
import type { ComponentProps } from 'react'
import Link from 'next/link'
import type { MDXComponents } from 'mdx/types'
import { useMDXComponent } from 'next-contentlayer2/hooks'
import MdxImage from '@/components/MdxImage'
import '@/styles/mdx.css'

import { cn } from '@/lib/utils'

const mdxComponents: MDXComponents = {
  h1: ({ className, ...props }: ComponentProps<'h1'>) => (
    <h1
      className={cn(
        'mt-2 scroll-m-20 text-3xl font-bold tracking-tight',
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: ComponentProps<'h2'>) => (
    <h2
      className={cn(
        'mt-10 scroll-m-20 pb-1 text-2xl font-semibold tracking-tight',
        'border-b border-zinc-200 dark:border-zinc-800',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentProps<'h3'>) => (
    <h3
      className={cn(
        'mt-8 scroll-m-20 text-xl font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }: ComponentProps<'h4'>) => (
    <h4
      className={cn(
        'mt-8 scroll-m-20 text-lg font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }: ComponentProps<'h5'>) => (
    <h5
      className={cn(
        'mt-8 scroll-m-20 text-[1.0625rem] font-semibold leading-[1.625rem] tracking-tight',
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }: ComponentProps<'h6'>) => (
    <h6
      className={cn(
        'mt-8 scroll-m-20 text-base font-semibold tracking-tight opacity-60',
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, ...props }: ComponentProps<'a'>) => (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'text-teal-700 hover:text-teal-600 dark:text-teal-600 dark:hover:text-teal-500',
        'transition-[color] duration-300',
        'font-medium underline underline-offset-4',
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }: ComponentProps<'p'>) => (
    <p
      className={cn(
        'leading-7',
        '[&:not(:first-child)]:mt-6',
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }: ComponentProps<'ul'>) => (
    <ul className={cn('nested-list-marker my-5 ml-4 list-disc marker:text-teal-600 dark:marker:text-teal-700', className)} {...props} />
  ),
  ol: ({ className, ...props }: ComponentProps<'ol'>) => (
    <ol className={cn('my-5 ml-4 list-decimal marker:text-teal-700 dark:marker:text-teal-600', className)} {...props} />
  ),
  li: ({ className, ...props }: ComponentProps<'li'>) => (
    <li
      className={cn(
        'mt-5',
        '[&>p:not(:first-child)]:mt-3',
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }: ComponentProps<'blockquote'>) => (
    <blockquote
      className={cn(
        'mt-6 border-l-2 pl-6 text-zinc-600 dark:text-zinc-400',
        className,
      )}
      {...props}
    />
  ),
  img: ({
    className,
    alt,
    ...props
  }: ComponentProps<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={cn('rounded-md', className)} alt={alt} {...props} />
  ),
  hr: ({ ...props }: ComponentProps<'hr'>) => <hr className="my-4 md:my-8" {...props} />,
  table: ({ className, ...props }: ComponentProps<'table'>) => (
    <div className="my-6 w-full overflow-hidden overflow-y-auto rounded-lg border border-zinc-200 drop-shadow-sm dark:border-zinc-800">
      <table
        className={cn(
          'w-full border-collapse bg-white dark:bg-zinc-950',
          className,
        )}
        {...props}
      />
    </div>
  ),
  tr: ({ className, ...props }: ComponentProps<'tr'>) => (
    <tr
      className={cn(
        'm-0 p-0 even:bg-zinc-50 dark:even:bg-zinc-900',
        className,
      )}
      {...props}
    />
  ),
  th: ({ className, ...props }: ComponentProps<'th'>) => (
    <th
      className={cn(
        'border-b border-r border-zinc-200 px-4 py-2 text-left font-bold last:border-r-0 dark:border-zinc-800 [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: ComponentProps<'td'>) => (
    <td
      className={cn(
        'border-r border-t border-zinc-200 px-4 py-2 text-left last:border-r-0 dark:border-zinc-800 [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }: ComponentProps<'pre'>) => (
    <pre
      className={cn(
        'mb-4 mt-6 overflow-x-auto rounded-lg border border-zinc-300/30 py-4 drop-shadow-sm dark:border-zinc-500/20',
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }: ComponentProps<'code'>) => (
    <code
      className={cn(
        'text-teal-700 dark:text-teal-600',
        'relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm',
        className,
      )}
      {...props}
    />
  ),
  MdxImage,
  Link: ({ className, ...props }: ComponentProps<typeof Link>) => (
    <Link
      className={cn('font-medium underline underline-offset-4', className)}
      {...props}
    />
  ),
}

type MdxProps = {
  code: string
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code)

  return (
    // eslint-disable-next-line tailwindcss/no-custom-classname
    <div className="mdx">
      <Component components={mdxComponents} />
    </div>
  )
}
