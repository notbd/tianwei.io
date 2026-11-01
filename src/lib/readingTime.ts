const WORDS_PER_MINUTE = 230

/**
 * Minutes it takes to read an MDX post, rounded, at least 1. Counts the
 * words of the prose: fenced code blocks and JSX/HTML tags (with their
 * attributes) are left out, since readers skim code rather than read it.
 */
export function readingMinutes(mdx: string): number {
  const prose = withoutFencedCode(mdx).replace(/<[^>]*>/g, ' ')
  const words = prose.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/** The source without its ``` / ~~~ fenced blocks (a fence closes on the same character, at least as long). */
function withoutFencedCode(mdx: string): string {
  const prose: string[] = []
  let fence: string | undefined
  for (const line of mdx.split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
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
