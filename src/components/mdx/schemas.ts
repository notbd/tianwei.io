import { z } from 'zod'

// Attribute schemas of the components posts may use (authorComponents in
// MdxComponents.tsx). MDX gives every attribute as a string, so each schema
// takes strings. Strict: an attribute a schema does not list, `children`
// and `key` included, fails the post instead of reaching React.

/** The one list of image sizes: MdxImage's size table follows it. */
export const sizeCategorySchema = z.enum(['sm', 'md', 'lg', 'xl', '2xl', '3xl'])

const pixelsSchema = z.string().regex(/^[1-9]\d*$/).transform(Number)

export const mdxImageAttributesSchema = z.strictObject({
  src: z.string().min(1),
  alt: z.string(),
  width: pixelsSchema,
  height: pixelsSchema,
  title: z.string().optional(),
  sizeCategory: sizeCategorySchema.optional(),
})

export const linkAttributesSchema = z.strictObject({
  href: z.string().min(1),
})
