import type { z } from 'zod'
import type { sizeCategorySchema } from '@/components/mdx/schemas'
import Image from 'next/image'
import { mdxImageAttributesSchema } from '@/components/mdx/schemas'
import { cn } from '@/lib/utils'

const mdxImageSizeCategoryRecord = {
  'sm': { maxWidthInRem: 24, tailwindMaxWidthClass: 'max-w-sm' },
  'md': { maxWidthInRem: 28, tailwindMaxWidthClass: 'max-w-md' },
  'lg': { maxWidthInRem: 32, tailwindMaxWidthClass: 'max-w-lg' },
  'xl': { maxWidthInRem: 36, tailwindMaxWidthClass: 'max-w-xl' },
  '2xl': { maxWidthInRem: 42, tailwindMaxWidthClass: 'max-w-2xl' },
  '3xl': { maxWidthInRem: 48, tailwindMaxWidthClass: 'max-w-3xl' },
} satisfies Record<z.infer<typeof sizeCategorySchema>, { maxWidthInRem: number, tailwindMaxWidthClass: string }>

export function MdxImage(attributes: z.input<typeof mdxImageAttributesSchema>) {
  // the syntax-tree check has already held the post to this schema; parsing
  // again turns the strings into typed props
  const { sizeCategory = 'lg', title, ...image } = mdxImageAttributesSchema.parse(attributes)
  const { maxWidthInRem, tailwindMaxWidthClass } = mdxImageSizeCategoryRecord[sizeCategory]

  return (
    <figure className="my-8">
      {/* src is a Cloudinary public id; src/lib/cloudinaryLoader.ts (images.loaderFile) builds the URL */}
      <Image
        sizes={`(max-width: ${maxWidthInRem}rem) 100vw, ${maxWidthInRem}rem`}
        className={cn('mx-auto w-full rounded-md', tailwindMaxWidthClass)}
        {...image}
      />

      {title !== undefined && title !== '' && (
        <figcaption className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-200">
          {title}
        </figcaption>
      )}
    </figure>
  )
}
