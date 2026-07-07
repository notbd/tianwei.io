const baseUrl = process.env.CONTENT_API_URL

// Fail fast and loud: an unset CONTENT_API_URL otherwise surfaces as
// fetch('/api/...') with a relative URL, which HANGS `next build` at the
// page-data collection stage instead of erroring.
if (baseUrl === undefined || baseUrl === '') {
  throw new Error(
    'CONTENT_API_URL is not set — the frontend cannot reach the content API. '
    + 'Set it in .env.local (local dev) or the environment (CI secret / Vercel env).',
  )
}

export const BASE_URL = baseUrl
