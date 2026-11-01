/* eslint-disable react-refresh/only-export-components -- Next.js metadata
 * file convention requires exporting size/contentType alongside the image */
import { OG_SIZE, ogCard } from '@/lib/ogCard'
import { site } from '@/lib/site'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = site.name

// The link-preview card for every page without its own (home, /posts, the
// category pages): the same template as the post cards.
export default async function OpengraphImage() {
  return ogCard({ title: site.name, description: site.description })
}
