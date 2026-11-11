import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pageMetadata } from '@/app/metadata'
import { PageHeader } from '@/components/PageHeader'
import { PostList } from '@/components/PostList'
import { TextLink } from '@/components/TextLink'
import { getCategories, getPosts } from '@/lib/api'
import { categoryLabel } from '@/lib/categories'
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
  const label = categoryLabel(decodeCategoryParam((await params).category))
  return pageMetadata(label, `${label} by ${site.name}.`)
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
    <div className="pb-8">
      <PageHeader
        title={categoryLabel(category)}
        description={(
          <>
            {filtered.length}
            {filtered.length === 1
              ? ' post'
              : ' posts'}
            {' in this category · '}
            <TextLink href="/posts">all posts</TextLink>
          </>
        )}
      />

      <PostList posts={filtered} />
    </div>
  )
}
