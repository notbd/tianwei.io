/**
 * Who the site belongs to: the name, description and profiles that the
 * page metadata, the feed, the manifest, OG images, JSON-LD and the home
 * page all show, kept in one place so they cannot drift apart.
 */
export const site = {
  name: 'Tianwei Zhang',
  domain: 'tianwei.io',
  description: 'A software developer.',
  email: 'hello@tianwei.io',
  twitter: {
    handle: '@defnotbd',
    id: '1110568647041400832',
  },
  // in the order the home page lists them
  profiles: [
    { label: 'GitHub', url: 'https://github.com/notbd' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/tianwei-z' },
    { label: 'Instagram', url: 'https://instagram.com/zhang13music' },
    { label: 'Twitter', url: 'https://twitter.com/defnotbd' },
  ],
} as const
