'use client'

import type { ImageLoaderProps } from 'next/image'

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

// next/image loader (next.config.ts `images.loaderFile`) for <MdxImage>:
// the Cloudinary delivery URL of the public id, capped at the requested
// width, in the format and quality Cloudinary picks for the browser.
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (cloudName === undefined || cloudName === '')
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set: MDX images cannot be resolved')

  const q = quality === undefined
    ? 'auto'
    : String(quality)
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,w_${width}/f_auto/q_${q}/v1/${src}`
}
