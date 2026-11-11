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
})

// The post contract's shared inputs. The content engine's tests hold the
// same list with the same verdicts: `check:contract` and this check must
// agree on every one of them.
describe('post rules', () => {
  // vitest does not load next.config, so next/image keeps its default
  // loader instead of the Cloudinary one, and that loader wants a root path
  const image = 'src="/cover.png" alt="A cover" width="1200" height="630"'

  it.each([
    ['a plain <MdxImage>', `<MdxImage ${image} />\n`, /<figure class="my-8"><img alt="A cover"[^>]* width="1200" height="630"/],
    ['an empty <MdxImage></MdxImage>, same as self-closing', `<MdxImage ${image}></MdxImage>\n`, /<figure class="my-8"><img alt="A cover"/],
    ['a <Link>', 'See <Link href="/posts">文字</Link>.\n', /<a class="text-teal-700 [^"]*" href="\/posts">文字<\/a>/],
    ['a <Link> around Markdown', '<Link href="/posts">**粗体** 和 _斜体_</Link>\n', /<a [^>]*href="\/posts"><strong>粗体<\/strong> 和 <em>斜体<\/em><\/a>/],
  ])('accepts and renders %s', async (_name, source, rendered) => {
    expect(await html(source)).toMatch(rendered)
  })

  it.each([
    // 1. JavaScript, fragments, member names
    ['an import', 'import x from \'y\'\n\nText\n', /JavaScript \(mdxjsEsm\)/],
    ['an export', 'export const x = 1\n\nText\n', /JavaScript \(mdxjsEsm\)/],
    ['a flow expression', '{1 + 1}\n', /JavaScript \(mdxFlowExpression\)/],
    ['an inline expression', 'Two is {1 + 1}.\n', /JavaScript \(mdxTextExpression\)/],
    ['an expression attribute', '<MdxImage src="/cover.png" alt="" width={1200} height="630" />\n', /JavaScript \(an expression or spread attribute\)/],
    ['a spread attribute', '<MdxImage {...props} />\n', /JavaScript \(an expression or spread attribute\)/],
    ['a fragment', '<>text</>\n', /a fragment/],
    ['a member name', '<A.B>text</A.B>\n', /a member name \(<A\.B>\)/],
    // 2. only listed components
    ['an unknown component', '<Callout>hi</Callout>\n', /<Callout> is not a post component/],
    ['<div style>', '<div style="x">text</div>\n', /<div> is not a post component/],
    ['<script>', '<script>alert(1)</script>\n', /<script> is not a post component/],
    ['<script> in a footnote definition', 'Text[^1]\n\n[^1]: <script src="x" />\n', /<script> is not a post component/],
    // 3. no valueless attributes
    ['a valueless attribute', `<MdxImage ${image} priority />\n`, /attribute "priority" has no value/],
    // 4. every attribute, as written, through the schema
    ['a missing height', '<MdxImage src="/cover.png" alt="A cover" width="1200" />\n', /height: /],
    ['sizeCategory="huge"', `<MdxImage ${image} sizeCategory="huge" />\n`, /sizeCategory: /],
    ['an extra attribute', `<MdxImage ${image} extra="x" />\n`, /Unrecognized key: "extra"/],
    ['children="x"', `<MdxImage ${image} children="x" />\n`, /Unrecognized key: "children"/],
    ['key="x"', `<MdxImage ${image} key="x" />\n`, /Unrecognized key: "key"/],
    ['a repeated attribute', '<MdxImage width="abc" width="1" src="/cover.png" alt="A cover" height="630" />\n', /repeats attribute "width"/],
    // 5. no content where the component takes none
    ['an <MdxImage> with content', `<MdxImage ${image}>caption</MdxImage>\n`, /<MdxImage> takes no content/],
  ])('refuses %s', async (_name, source, reason) => {
    await expect(renderMdx(source)).rejects.toThrow(reason)
  })

  it('reports the line a rule breaks on', async () => {
    await expect(renderMdx('Intro\n\n<Callout>hi</Callout>\n')).rejects.toThrow(/at line 3:/)
  })

  it('fails on a "|" inside an attribute in a table cell, a syntax error under GFM', async () => {
    await expect(renderMdx('| a | b |\n| - | - |\n| <Link href="a|b">x</Link> | 2 |\n')).rejects.toThrow(/Unexpected end of file in attribute value/)
  })
})
