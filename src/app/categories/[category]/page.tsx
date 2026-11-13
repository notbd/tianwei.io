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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const label = categoryLabel((await params).category)
  return pageMetadata(label, `${label} by ${site.name}.`)
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params

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
