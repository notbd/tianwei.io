import type { MDXRemoteProps } from 'next-mdx-remote/rsc'
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

type CompileMDXResult<TFrontmatter> = {
  content: React.ReactElement
  frontmatter: TFrontmatter
}

export async function compileMdxContent<
  TFrontmatter extends Record<string, unknown> = Record<string, unknown>,
>(source: string): Promise<CompileMDXResult<TFrontmatter>> {
  const result = await compileMDX<TFrontmatter>({
    source,
    components: mdxComponents as MDXRemoteProps['components'],
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

  return result
}
