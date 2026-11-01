import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { renderMdx } from './mdx'

async function html(source: string): Promise<string> {
  return renderToStaticMarkup(await renderMdx(source))
}

describe('renderMdx', () => {
  it('renders Markdown and GFM through the site components, with heading self-links', async () => {
    const out = await html('## Hello World\n\nSome **bold** and a [link](https://example.com).\n\n| a | b |\n| - | - |\n| 1 | 2 |\n')
    expect(out).toContain('id="hello-world"')
    expect(out).toContain('<a href="#hello-world" class="anchor">Hello World</a>')
    expect(out).toContain('<strong>bold</strong>')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('<table')
  })

  it('highlights fenced code and wraps it with a copy button', async () => {
    const out = await html('```ts title="a.ts"\nconst a = 1\n```\n')
    expect(out).toContain('data-rehype-pretty-code-title')
    expect(out).toContain('data-code-block')
    expect(out).toContain('aria-label="Copy code"')
  })

  it('renders components with string props', async () => {
    // (MdxImage needs the next.config image loader, which vitest does not load)
    const out = await html('See <Link href="/posts">all posts</Link>.\n')
    expect(out).toContain('<a class="font-medium underline underline-offset-4" href="/posts">all posts</a>')
  })

  it.each([
    ['an import', 'import x from \'y\'\n\nText\n'],
    ['an export', 'export const x = 1\n\nText\n'],
    ['a flow expression', '{1 + 1}\n'],
    ['an inline expression', 'Two is {1 + 1}.\n'],
    ['an expression prop', '<MdxImage src="a" width={480} height="1" alt="" />\n'],
    ['a spread prop', '<MdxImage {...props} />\n'],
  ])('refuses %s, since evaluating it would run code', async (_name, source) => {
    await expect(renderMdx(source)).rejects.toThrow(/MDX JavaScript is not allowed/)
  })
})
