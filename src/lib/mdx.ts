import type { Options as RehypePrettyCodeOptions } from 'rehype-pretty-code'
import { compileMDX } from 'next-mdx-remote/rsc'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { mdxComponents } from '@/components/mdx/MdxComponents'

const rehypePrettyCodeOptions: RehypePrettyCodeOptions = {
  theme: {
    dark: 'vitesse-dark',
    light: 'vitesse-light',
  },
  keepBackground: true,
}

export async function compileMdxContent(source: string): Promise<React.ReactElement> {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: false, // frontmatter already parsed by API
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypePrettyCode, rehypePrettyCodeOptions],
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'wrap',
              properties: {
                className: ['anchor'],
              },
            },
          ],
        ],
      },
    },
  })

  return content
}
