import { describe, expect, it } from 'vitest'
import { postBodyHash } from './postBodyHash'

describe('postBodyHash', () => {
  it('hashes the exact UTF-8 bytes, CRLF and trailing newline included', () => {
    // The content engine's tests hold the same text and the same hex: both
    // ends must compute the same value for a body
    expect(postBodyHash('标题 🚀\r\n第二行 café\n')).toBe('9e991956f3864def377864042db5e9bfdbad7d31c1d373e19e8d8a98e35b2609')
  })
})
