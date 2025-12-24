import type { Post, PostSummary } from '@/lib/api'
import { notFound } from 'next/navigation'
import { MdxContent } from '@/components/mdx/MdxContent'
import { apiClient } from '@/lib/api'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts: PostSummary[] = await apiClient.post.listAll()
  return posts.map(post => ({ slug: post.slug }))
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params

  let post: Post
  try {
    post = await apiClient.post.getBySlug(slug)
  }
  catch {
    notFound()
  }

  return (
    <main className="max-w-3xl pb-8">

      {/* header */}
      <header className="mb-16 pb-4 border-b border-gray-200/30 dark:border-gray-800/30">

        {/* title */}
        <h1 className="text-2xl font-bold">{post.title}</h1>

        {/* (optional) description */}
        {post.description && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{post.description}</p>
        )}

        {/* other attributes */}
        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          <time>
            {post.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
          {/* <span className="mx-2">|</span>
          <span>{post.category}</span> */}
        </div>
      </header>

      {/* content */}
      <MdxContent source={post.content} />

    </main>
  )
}
