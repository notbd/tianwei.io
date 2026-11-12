import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MdxImage } from './MdxImage'

describe('mdxImage', () => {
  it.each([
    ['default (lg)', undefined, '(max-width: 35rem) calc(100vw - 3rem), 32rem'],
    ['sm', 'sm', '(max-width: 27rem) calc(100vw - 3rem), 24rem'],
    ['3xl', '3xl', '(max-width: 51rem) calc(100vw - 3rem), 48rem'],
  ] as const)('sizes a %s image to its slot: the viewport less the page gutter, up to its own width', (_name, sizeCategory, sizes) => {
    const html = renderToStaticMarkup(<MdxImage src="/cover.png" alt="A cover" width="1200" height="630" sizeCategory={sizeCategory} />)
    expect(html).toContain(`sizes="${sizes}"`)
  })
})
