import { createHash } from 'node:crypto'

/**
 * The meta tag each post page reports its body's hash in. The content
 * engine's deploy reads it from every post page and compares it with the
 * body it just synced, which proves the page shows the new version
 * (docs/adr/0006). Only the body: it is the part that can fail to render.
 */
export const POST_BODY_HASH_META = 'post-body-sha256'

/** SHA-256 of a post body exactly as the API returned it (UTF-8, untrimmed), in lowercase hex. */
export function postBodyHash(body: string): string {
  return createHash('sha256').update(body).digest('hex')
}
