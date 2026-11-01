import { describe, expect, it } from 'vitest'
import { readingMinutes } from './readingTime'

const words = (count: number) => Array.from({ length: count }).fill('word').join(' ')

describe('readingMinutes', () => {
  it('rounds prose words at 230 per minute, never below one minute', () => {
    expect(readingMinutes('')).toBe(1)
    expect(readingMinutes(words(100))).toBe(1)
    expect(readingMinutes(words(460))).toBe(2)
    expect(readingMinutes(words(1000))).toBe(4)
  })

  it('leaves fenced code and JSX/HTML tags out of the count', () => {
    const code = `\`\`\`swift title="A.swift"\n${words(2000)}\n\`\`\``
    const tag = `<MdxImage\n  src="a/b"\n  alt="${words(500)}"\n/>`
    expect(readingMinutes(`${words(460)}\n\n${code}\n\n${tag}`)).toBe(2)
  })

  it('also leaves out fences inside list items and blockquotes', () => {
    const code = words(2000)
    expect(readingMinutes(`${words(460)}\n\n- A step:\n\n  \`\`\`sh\n  ${code}\n  \`\`\`\n`)).toBe(2)
    expect(readingMinutes(`${words(460)}\n\n> \`\`\`ts\n> ${code}\n> \`\`\`\n`)).toBe(2)
    expect(readingMinutes(`${words(460)}\n\n1. \`\`\`ts\n   ${code}\n   \`\`\`\n`)).toBe(2)
  })

  it('counts each Chinese or Japanese character as a word', () => {
    expect(readingMinutes('字'.repeat(690))).toBe(3)
    expect(readingMinutes(`${'字'.repeat(230)} ${words(230)}`)).toBe(2)
  })

  it('counts words, not punctuation, markdown syntax or contractions twice', () => {
    expect(readingMinutes(`## Heading\n\n- I'm **bold**, [a link](https://x.y/z) and \`code\`.\n`)).toBe(1)
    const sentence = 'It\'s a well-known fact, isn\'t it? '
    // 6 words per sentence
    expect(readingMinutes(sentence.repeat(77))).toBe(2)
  })
})
