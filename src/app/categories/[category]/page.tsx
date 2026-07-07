import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PostList } from '@/components/PostList'
import { apiClient } from '@/lib/api'

type PageProps = {
  params: Promise<{ category: string }>
}

export async function generateStaticParams() {
  const categories = await apiClient.category.listAll()
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
  return {
    title: category, // root template appends '· tianwei.io'
    description: `Posts in the ${category} category`,
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const category = decodeCategoryParam((await params).category)

  const [posts, categories] = await Promise.all([
    apiClient.post.listAll(),
    apiClient.category.listAll(),
  ])

  if (!categories.includes(category))
    notFound()

  const filtered = posts.filter(post => post.category === category)

  return (
    <main className="max-w-3xl pb-8">

      {/* header */}
      <header className="mb-12 pb-4 border-b border-gray-200/30 dark:border-gray-800/30">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          {category}
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-200">
          {filtered.length}
          {filtered.length === 1 ? ' post' : ' posts'}
          {' in this category · '}
          <Link href="/posts" className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700 dark:decoration-zinc-700 dark:hover:text-zinc-300">
            all posts
          </Link>
        </p>
      </header>

      <PostList posts={filtered} />
    </main>
  )
}
