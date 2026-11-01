import type { Root } from 'mdast'
import type { Options as RehypePrettyCodeOptions } from 'rehype-pretty-code'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
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

/** Compiles a post's MDX source (frontmatter already stripped by the content engine) into React elements. */
export async function renderMdx(source: string): Promise<React.ReactElement> {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    development: false,
    remarkPlugins: [remarkNoJavaScript, remarkGfm],
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
  })
  return <Content components={mdxComponents} />
}

type MdxNode = {
  type: string
  children?: MdxNode[]
  attributes?: { type: string, value?: unknown }[]
  position?: { start: { line: number } }
}

const JAVASCRIPT_NODES = new Set(['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'])

/**
 * Post sources are data from the API, and evaluating MDX runs its
 * JavaScript, so a post must not contain any: no import/export, no
 * `{expression}`, no `prop={value}` or `{...spread}` attribute. Components
 * still take string props (`width="480"`). The content engine rejects the
 * same constructs at sync time, so this only fires on content that
 * bypassed it.
 */
export function remarkNoJavaScript() {
  return (tree: Root) => {
    assertNoJavaScript(tree)
  }
}

function assertNoJavaScript(node: MdxNode): void {
  const hasJavaScript = JAVASCRIPT_NODES.has(node.type)
    || node.attributes?.some(attribute => attribute.type === 'mdxJsxExpressionAttribute'
      || (typeof attribute.value === 'object' && attribute.value !== null)) === true
  if (hasJavaScript)
    throw new Error(`MDX JavaScript is not allowed in posts (${node.type} at line ${node.position?.start.line ?? '?'})`)
  node.children?.forEach(assertNoJavaScript)
}
