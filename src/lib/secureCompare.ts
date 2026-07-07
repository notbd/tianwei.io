import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Constant-time string equality for secret comparison. Hashing both
 * sides first equalizes lengths (timingSafeEqual requires equal-length
 * buffers) and removes any length side channel.
 */
export function secureEquals(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(a).digest()
  const digestB = createHash('sha256').update(b).digest()
  return timingSafeEqual(digestA, digestB)
}
