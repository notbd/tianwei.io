import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadata as rootMetadata } from '@/app/metadata'
import { PageHeader } from '@/components/PageHeader'
import { PostList } from '@/components/PostList'
import { TextLink } from '@/components/TextLink'
import { getCategories, getPosts } from '@/lib/api'
import { site } from '@/lib/site'

type PageProps = {
  params: Promise<{ category: string }>
}

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map(category => ({ category }))
}

// Route params may arrive percent-encoded; categories are slugified
// (ASCII-safe) today, so this is future-proofing, not a hot path.
function decodeCategoryParam(raw: string): string {
  try {
    return decodeURIComponent(raw)
  }
  catch {
    return raw
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = decodeCategoryParam((await params).category)
  const description = `Posts in the ${category} category`
  return {
    title: category, // root template appends '· tianwei.io'
    description,
    // a child openGraph/twitter replaces the root's whole object, hence the spreads
    openGraph: { ...rootMetadata.openGraph, title: category, description },
    twitter: { ...rootMetadata.twitter, title: `${category} • ${site.domain}`, description },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const category = decodeCategoryParam((await params).category)

  const [posts, categories] = await Promise.all([
    getPosts(),
    getCategories(),
  ])

  if (!categories.includes(category))
    notFound()

  const filtered = posts.filter(post => post.category === category)

  return (
    <div className="max-w-3xl pb-8">
      <PageHeader title={category}>
        <p className="mt-2 text-zinc-500 dark:text-zinc-200">
          {filtered.length}
          {filtered.length === 1
            ? ' post'
            : ' posts'}
          {' in this category · '}
          <TextLink href="/posts">all posts</TextLink>
        </p>
      </PageHeader>

      <PostList posts={filtered} />
    </div>
  )
}
