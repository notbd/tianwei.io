import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { JsonLd } from './JsonLd'

describe('jsonLd', () => {
  it('serializes the data so text from the API cannot close the script tag', () => {
    const html = renderToStaticMarkup(<JsonLd data={{ headline: '</script><script>alert(1)</script>' }} />)
    expect(html).toBe('<script type="application/ld+json">{"headline":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}</script>')
    expect(JSON.parse(html.slice(html.indexOf('>') + 1, html.lastIndexOf('<')))).toEqual({ headline: '</script><script>alert(1)</script>' })
  })
})
