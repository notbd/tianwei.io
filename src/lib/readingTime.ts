const WORDS_PER_MINUTE = 230

/**
 * Minutes it takes to read an MDX post, rounded, at least 1. Counts the
 * words of the prose: fenced code blocks and JSX/HTML tags (with their
 * attributes) are left out, since readers skim code rather than read it.
 * Each Chinese or Japanese character counts as a word (those scripts do
 * not separate words with spaces), which errs on the long side.
 */
export function readingMinutes(mdx: string): number {
  const prose = withoutFencedCode(mdx).replace(/<[^>]*>/g, ' ')
  const cjk = prose.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0
  const words = prose
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, ' ')
    .match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)
    ?.length ?? 0
  return Math.max(1, Math.round((words + cjk) / WORDS_PER_MINUTE))
}

/**
 * The source without its ``` / ~~~ fenced blocks (a fence closes on the
 * same character, at least as long), including fences indented inside list
 * items or blockquotes.
 */
function withoutFencedCode(mdx: string): string {
  const prose: string[] = []
  let fence: string | undefined
  for (const line of mdx.split('\n')) {
    const marker = /^[\s>]*(?:[-*+]\s+|\d+[.)]\s+)?(`{3,}|~{3,})/.exec(line)?.[1]
    if (fence === undefined) {
      if (marker === undefined)
        prose.push(line)
      else
        fence = marker
    }
    else if (marker !== undefined && marker[0] === fence[0] && marker.length >= fence.length) {
      fence = undefined
    }
  }
  return prose.join('\n')
}
