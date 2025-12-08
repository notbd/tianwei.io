import { post } from './post'

export const apiClient = {
  post,
}

export { NetworkRequestError } from './errors'
export type { Post, PostSummary } from './post'
