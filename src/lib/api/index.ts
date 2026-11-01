import { category } from './category'
import { post } from './post'

export const apiClient = {
  post,
  category,
}

export { isNotFoundError, NetworkRequestError } from './errors'
export type { Post, PostSummary } from './post'
