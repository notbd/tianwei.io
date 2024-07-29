import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import '@/styles/mdx.css'
import { Mdx } from '@/components/mdx-components'

type PostProps = {
  params: {
    slug: string
  }
}

export function generateStaticParams() {
  return allPosts.map(post => ({
    slug: post._raw.flattenedPath,
  }))
}

export default async function Post({ params }: PostProps) {
  const post = allPosts.find(post => post.slugAsParams === params.slug)

  if (!post) {
    notFound()
  }

  return (
    <article>
      <Mdx code={post.body.code} />
    </article>
  )
}
