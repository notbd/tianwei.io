'use client'

import type { ImageLoaderProps } from 'next/image'

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

// next/image loader (next.config.ts `images.loaderFile`). Emits the same
// delivery URL next-cloudinary did for <MdxImage>: a width-capped,
// format- and quality-negotiated rendition of the Cloudinary public id.
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (cloudName === undefined || cloudName === '')
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set — MDX images cannot be resolved')

  const q = quality === undefined ? 'auto' : String(quality)
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,w_${width}/f_auto/q_${q}/v1/${src}`
}
