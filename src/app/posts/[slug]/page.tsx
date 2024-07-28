import { allPosts } from 'content-collections'
import { notFound } from 'next/navigation'
import { MDXContent } from '@content-collections/mdx/react'

type PostProps = {
  params: {
    slug: string
  }
}

export default function Post({ params }: PostProps) {
  const post = allPosts.find(post => post._meta.path === params.slug)

  if (!post) {
    notFound()
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <MDXContent code={post.mdx} />
    </article>
  )
}
