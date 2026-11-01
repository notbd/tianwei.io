import type { Metadata } from 'next'
import { PageHeader } from '@/components/PageHeader'
import { TextLink } from '@/components/TextLink'
import { metadata as rootMetadata } from './metadata'

// A 404 has no canonical URL: the root's './' would resolve to the internal
// /_not-found route (or to the missing path). A child `alternates` or
// `openGraph` replaces the root's whole object, hence the spreads.
export const metadata: Metadata = {
  title: 'Page Not Found', // root template appends '· tianwei.io'
  alternates: { ...rootMetadata.alternates, canonical: null },
  openGraph: { ...rootMetadata.openGraph, url: null },
}

// Root not-found boundary. Unmatched URLs render it server-side inside the
// root layout (header, footer, theme scripts). notFound() from the post and
// category pages hydrates into the same UI, but its HTML stays Next's bare
// <html id="__next_error__"> shell: without Cache Components, Next 16 does
// not server-render a not-found boundary for a notFound() thrown during
// static generation (app-render prerenderToStream only looks the boundary up
// when cacheComponents is on). The shell still carries this file's metadata.
export default function NotFound() {
  return (
    <div className="max-w-3xl pb-8">
      <PageHeader title="Page Not Found">
        <p className="mt-2 text-zinc-500 dark:text-zinc-200">
          {'The page you\'re looking for doesn\'t exist or may have moved. Go back to the '}
          <TextLink href="/">home page</TextLink>
          {', or browse '}
          <TextLink href="/posts">all posts</TextLink>
          .
        </p>
      </PageHeader>
    </div>
  )
}
