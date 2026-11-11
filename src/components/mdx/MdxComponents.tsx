import type { MDXComponents } from 'mdx/types'
import type { ComponentProps, ComponentType } from 'react'
import type { z } from 'zod'
import { CopyCodeButton } from '@/components/mdx/CopyCodeButton'
import { MdxImage } from '@/components/mdx/MdxImage'
import { MdxLink } from '@/components/mdx/MdxLink'
import { linkAttributesSchema, mdxImageAttributesSchema } from '@/components/mdx/schemas'
import { cn } from '@/lib/utils'

// Styles for the HTML elements Markdown produces. A post cannot name these
// as JSX: the syntax-tree check (src/lib/mdx.tsx) only lets through the
// components in authorComponents below.
const markdownElements = {
  h1: ({ className, ...props }: ComponentProps<'h1'>) => (
    <h1
      className={cn(
        'mt-10 scroll-m-20 text-3xl font-bold tracking-tight text-balance',
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: ComponentProps<'h2'>) => (
    <h2
      className={cn(
        'mt-10 scroll-m-20 pb-1 text-2xl font-semibold tracking-tight text-balance',
        'border-b border-zinc-200 dark:border-zinc-800',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentProps<'h3'>) => (
    <h3
      className={cn(
        'mt-8 scroll-m-20 text-xl font-semibold tracking-tight text-balance',
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
        'mt-8 scroll-m-20 text-[1.0625rem] font-semibold leading-6.5 tracking-tight',
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
  a: ({ className, href = '', ...props }: ComponentProps<'a'>) => {
    // rehype-autolink-headings wraps each heading's text in an `.anchor`
    // link; it keeps the heading's own colour and weight (mdx.tailwind.css)
    if (className === 'anchor')
      return <a href={href} className={className} {...props} />

    const isExternal
      = href.startsWith('http')
        || href.startsWith('mailto:')
        || href.startsWith('tel:')

    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className={cn(
          'text-teal-700 hover:text-teal-600 dark:text-teal-600 dark:hover:text-teal-500',
          'transition-[color] duration-200 font-medium underline underline-offset-4',
          className,
        )}
        {...props}
      />
    )
  },
  p: ({ className, ...props }: ComponentProps<'p'>) => (
    <p
      className={cn('leading-7 text-pretty', 'not-first:mt-6', className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: ComponentProps<'ul'>) => (
    <ul
      className={cn(
        'nested-list-marker my-5 ml-4 list-disc marker:text-teal-600 dark:marker:text-teal-700',
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: ComponentProps<'ol'>) => (
    <ol
      className={cn(
        'my-5 ml-4 list-decimal marker:text-teal-700 dark:marker:text-teal-600',
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: ComponentProps<'li'>) => (
    <li
      className={cn('mt-5', '[&>p:not(:first-child)]:mt-3', className)}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }: ComponentProps<'blockquote'>) => (
    <blockquote
      className={cn(
        'mt-6 border-l-2 border-zinc-300 pl-6 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400',
        className,
      )}
      {...props}
    />
  ),
  img: ({ className, alt, ...props }: ComponentProps<'img'>) => (
    // plain Markdown images carry arbitrary URLs, not Cloudinary public ids, so they bypass next/image and its Cloudinary loader; use <MdxImage> for optimized images
    // eslint-disable-next-line next/no-img-element
    <img className={cn('rounded-md', className)} alt={alt} {...props} />
  ),
  hr: ({ ...props }: ComponentProps<'hr'>) => (
    <hr className="my-4 border-zinc-200 md:my-8 dark:border-zinc-800" {...props} />
  ),
  table: ({ className, ...props }: ComponentProps<'table'>) => (
    <div className="my-6 w-full overflow-x-auto rounded-lg border border-zinc-200 drop-shadow-sm dark:border-zinc-800">
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
        'border-b border-r border-zinc-200 px-4 py-2 text-left font-bold last:border-r-0 dark:border-zinc-800 [[align=center]]:text-center [[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: ComponentProps<'td'>) => (
    <td
      className={cn(
        'border-r border-t border-zinc-200 px-4 py-2 text-left last:border-r-0 dark:border-zinc-800 [[align=center]]:text-center [[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  // the wrapper carries the margins so the copy button can sit in the
  // block's corner without scrolling away with wide code
  pre: ({ className, ...props }: ComponentProps<'pre'>) => (
    <div data-code-block className="group/code relative mb-4 mt-6">
      <pre
        className={cn(
          'overflow-x-auto rounded-lg border border-zinc-300/30 py-4 drop-shadow-sm dark:border-zinc-500/20',
          className,
        )}
        {...props}
      />
      <CopyCodeButton
        className={cn(
          'absolute right-2 top-2',
          'opacity-0 focus-visible:opacity-100 group-hover/code:opacity-100 pointer-coarse:opacity-100',
        )}
      />
    </div>
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
} satisfies MDXComponents

type AuthorComponent = {
  component: ComponentType<never>
  /** Every attribute the component accepts; strict, so no other gets through */
  attributes: z.ZodObject<z.ZodRawShape, z.core.$strict>
  /** Whether the component takes content between its tags */
  children: boolean
}

/**
 * The components a post may use, by the name it writes them with. The
 * syntax-tree check enforces this table and /contract.json publishes it,
 * so the content engine applies the same rules before it syncs a post.
 * A new component starts here (docs/adr/0006 says which deploy goes first).
 */
export const authorComponents = {
  MdxImage: { component: MdxImage, attributes: mdxImageAttributesSchema, children: false },
  Link: { component: MdxLink, attributes: linkAttributesSchema, children: true },
} satisfies Record<string, AuthorComponent>

export const mdxComponents: MDXComponents = {
  ...markdownElements,
  ...Object.fromEntries(Object.entries(authorComponents).map(([name, { component }]) => [name, component])),
}
