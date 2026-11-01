import type { ImageProps } from 'next/image'
import Image from 'next/image'

const _mdxImageSizeCategories = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
type MdxImageSizeCategory = typeof _mdxImageSizeCategories[number]

type MdxImageProps = ImageProps & {
  title?: string
  sizeCategory?: MdxImageSizeCategory
}

const mdxImageSizeCategoryRecord: Record<MdxImageSizeCategory, { maxWidthInRem: number, tailwindMaxWidthClass: string }> = {
  'sm': { maxWidthInRem: 24, tailwindMaxWidthClass: 'max-w-sm' },
  'md': { maxWidthInRem: 28, tailwindMaxWidthClass: 'max-w-md' },
  'lg': { maxWidthInRem: 32, tailwindMaxWidthClass: 'max-w-lg' },
  'xl': { maxWidthInRem: 36, tailwindMaxWidthClass: 'max-w-xl' },
  '2xl': { maxWidthInRem: 42, tailwindMaxWidthClass: 'max-w-2xl' },
  '3xl': { maxWidthInRem: 48, tailwindMaxWidthClass: 'max-w-3xl' },
}

export default function MdxImage({
  sizeCategory = 'lg',
  title,
  ...props
}: MdxImageProps) {
  const { maxWidthInRem, tailwindMaxWidthClass } = mdxImageSizeCategoryRecord[sizeCategory]

  return (
    <figure className="my-8">
      {/* src is a Cloudinary public id; the loader in next.config.ts builds the URL */}
      <Image
        sizes={`(max-width: ${maxWidthInRem}rem) 100vw, ${maxWidthInRem}rem`}
        className={`mx-auto w-full max-w-3xl rounded-md ${tailwindMaxWidthClass}`}
        {...props}
      />

      {title !== undefined && title !== '' && (
        <figcaption className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-200">
          {title}
        </figcaption>
      )}
    </figure>
  )
}
