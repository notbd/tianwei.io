export class NetworkRequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'NetworkRequestError'
  }
}

// The API answers 404 for a slug it does not have and 400 for one that fails
// its slug validation (uppercase, consecutive hyphens, too long). Both mean
// the URL names no post, so pages render notFound() for both; the fetcher
// retries neither.
export function isNotFoundError(error: unknown): boolean {
  return error instanceof NetworkRequestError && (error.status === 404 || error.status === 400)
}
