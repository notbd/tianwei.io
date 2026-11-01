/**
 * A category as the site shows it: the slug with its first letter
 * capitalized ("articles" -> "Articles"). URLs and the API keep the slug.
 */
export function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}
