type JsonLdProps = {
  /** A schema.org object, e.g. `{ '@context': 'https://schema.org', '@type': 'Person', ... }`. */
  data: Record<string, unknown>
}

/**
 * Structured data for search engines. `<` is escaped so text from the API
 * (titles, descriptions) can never close the script tag:
 * https://nextjs.org/docs/app/guides/json-ld
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/dom-no-dangerously-set-innerhtml -- serialized JSON with `<` escaped
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replaceAll('<', '\\u003c'),
      }}
    />
  )
}
