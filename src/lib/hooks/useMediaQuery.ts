import { useCallback, useSyncExternalStore } from 'react'

/**
 * A custom React hook that listens for changes to a given CSS media query string.
 *
 * This is useful for responding to viewport or device changes (e.g., dark mode,
 * screen size) in React components.
 *
 * Built on useSyncExternalStore: the snapshot is always read fresh from
 * matchMedia, so a changed `query` can never report the previous query's
 * stale value.
 *
 * @param query - A valid CSS media query string (e.g., '(max-width: 768px)')
 * @returns A boolean indicating whether the media query currently matches,
 *          or `undefined` when running in a non-browser environment (SSR).
 */
export function useMediaQuery(query: string): boolean | undefined {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const media = window.matchMedia(query)
    media.addEventListener('change', onStoreChange)
    return () => media.removeEventListener('change', onStoreChange)
  }, [query])

  return useSyncExternalStore<boolean | undefined>(
    subscribe,
    () => window.matchMedia(query).matches,
    () => undefined, // server snapshot
  )
}
