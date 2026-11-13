import type { Root } from 'mdast'
import type { Options as RehypePrettyCodeOptions } from 'rehype-pretty-code'
import type { ShikiTransformer } from 'shiki'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { authorComponents, mdxComponents } from '@/components/mdx/MdxComponents'

// Shiki stops colouring a line after 500 ms (tokenizeTimeLimit) and says
// nothing, so a machine under load renders the same source with fewer
// colours, and two builds of one post differ. No limit, no difference: a
// post's code is the author's own and small, so nothing here can run away.
const noTokenizeTimeLimit: ShikiTransformer = {
  name: 'no-tokenize-time-limit',
  preprocess(_code, options) {
    options.tokenizeTimeLimit = 0
  },
}

const rehypePrettyCodeOptions: RehypePrettyCodeOptions = {
  theme: {
    dark: 'vitesse-dark',
    light: 'vitesse-light',
  },
  keepBackground: true,
  // a fence without a language is highlighted as plain text, so every block
  // gets the same markup (figure, line spans) and with it the same styles
  defaultLang: { block: 'plaintext' },
  transformers: [noTokenizeTimeLimit],
}

/** Compiles a post's MDX source (frontmatter already stripped by the content engine) into React elements. */
export async function renderMdx(source: string): Promise<React.ReactElement> {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    development: false,
    // remark-gfm extends the syntax: the content engine parses posts with
    // the same plugins, and must add any other syntax plugin added here
    remarkPlugins: [remarkGfm, remarkPostRules],
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
  name?: string | null | undefined
  children?: MdxNode[] | undefined
  attributes?: { type: string, name?: string | undefined, value?: unknown }[] | undefined
  position?: { start: { line: number } } | undefined
}

const JAVASCRIPT_NODES = new Set(['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'])
const JSX_NODES = new Set(['mdxJsxFlowElement', 'mdxJsxTextElement'])
const COMPONENTS = new Map(Object.entries(authorComponents))

/**
 * What a post body may contain: Markdown, plus the components in
 * authorComponents with string attributes their schema accepts. No
 * JavaScript (evaluating MDX runs it, and post sources are data from the
 * API) and no other JSX element. The content engine runs the same five
 * steps against /contract.json before it syncs a post, so this only fires
 * on content that bypassed it.
 */
function remarkPostRules() {
  return (tree: Root) => {
    assertPostRules(tree)
  }
}

function assertPostRules(node: MdxNode): void {
  const violation = JAVASCRIPT_NODES.has(node.type)
    ? `JavaScript (${node.type})`
    : JSX_NODES.has(node.type)
      ? jsxViolation(node)
      : undefined
  if (violation !== undefined)
    throw new Error(`Post body breaks the post rules at line ${node.position?.start.line ?? '?'}: ${violation}`)
  node.children?.forEach(assertPostRules)
}

/** The first rule a JSX element breaks, in the order both ends check them. */
function jsxViolation({ name, attributes = [], children = [] }: MdxNode): string | undefined {
  // 1. no JavaScript, fragments or member names
  if (attributes.some(attribute => attribute.type === 'mdxJsxExpressionAttribute'
    || (typeof attribute.value === 'object' && attribute.value !== null))) {
    return 'JavaScript (an expression or spread attribute); give components string attributes'
  }
  if (typeof name !== 'string')
    return 'a fragment (<>)'
  if (name.includes('.'))
    return `a member name (<${name}>)`

  // 2. a listed component
  const component = COMPONENTS.get(name)
  if (component === undefined)
    return `<${name}> is not a post component (posts may use ${Array.from(COMPONENTS.keys(), key => `<${key}>`).join(', ')})`

  // 3. every attribute has a value
  const valueless = attributes.find(attribute => attribute.value === null)
  if (valueless !== undefined)
    return `<${name}> attribute "${valueless.name}" has no value`

  // 4. all the attributes, as written, satisfy the component's schema
  const names = attributes.map(attribute => attribute.name)
  const repeated = names.find((attribute, i) => names.indexOf(attribute) !== i)
  if (repeated !== undefined)
    return `<${name}> repeats attribute "${repeated}"`
  const parsed = component.attributes.safeParse(Object.fromEntries(attributes.map(attribute => [attribute.name, attribute.value])))
  if (!parsed.success) {
    const issues = parsed.error.issues.map(issue => issue.path.length > 0
      ? `${issue.path.join('.')}: ${issue.message}`
      : issue.message)
    return `<${name}> attributes: ${issues.join('; ')}`
  }

  // 5. content only where the component takes it
  if (!component.children && children.length > 0)
    return `<${name}> takes no content between its tags`

  return undefined
}
