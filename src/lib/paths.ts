import { site } from '@/lib/site'

// VERCEL_URL is ALWAYS the generated <deployment>.vercel.app host, even in
// production, so absolute URLs (sitemap, feed, og:url, canonical, RSS
// guids) use the canonical domain there, and the deployment host only on
// previews, where links should stay on the preview.
const vercelUrl = process.env.VERCEL_URL
const isPreview = process.env.VERCEL_ENV !== 'production' && vercelUrl !== undefined && vercelUrl !== ''

export const SITE_URL = `https://${isPreview ? vercelUrl : site.domain}`

/** `path` (starting with `/`) on the site's own origin. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`
}

// Route paths, built in one place for every link, sitemap entry and feed
// item. The content engine slugifies both slugs and categories to
// [a-z0-9-], so neither needs encoding.
export function postPath(slug: string): string {
  return `/posts/${slug}`
}

export function categoryPath(category: string): string {
  return `/categories/${category}`
}
