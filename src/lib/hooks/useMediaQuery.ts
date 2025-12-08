import { useEffect, useState } from 'react'

/**
 * A custom React hook that listens for changes to a given CSS media query string.
 *
 * This is useful for responding to viewport or device changes (e.g., dark mode,
 * screen size) in React components.
 *
 * @param query - A valid CSS media query string (e.g., '(max-width: 768px)')
 * @returns A boolean indicating whether the media query currently matches,
 *          or `undefined` when running in a non-browser environment (SSR).
 */
export function useMediaQuery(query: string) {
  const getMatches = () =>
    typeof window !== 'undefined'
      ? window.matchMedia(query).matches
      : undefined

  const [matches, setMatches] = useState<boolean | undefined>(getMatches)

  useEffect(() => {
    if (typeof window === 'undefined')
      return

    const media = window.matchMedia(query)
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)

    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}
