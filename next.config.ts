import type { NextConfig } from 'next'

// A baseline Content-Security-Policy, without nonces or hashes: scripts,
// frames, plugins, form targets and <base> can only come from the site, and
// no one can frame it. It cannot stop an inline <script>; keeping those out
// of posts is the post rules' job (src/lib/mdx.tsx), and this is the
// fallback if they regress. Hashes are out because Next inlines per-page
// RSC payload scripts, and nonces would make every page render per request,
// giving up static generation. Production only: `next dev` needs eval and a
// websocket for hot reload.
const contentSecurityPolicy = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`, // the theme scripts and Next's RSC payload
  `style-src 'self' 'unsafe-inline'`, // Shiki's and React's inline styles
  `img-src 'self' data: https:`, // Cloudinary, and Markdown images from anywhere
  `font-src 'self'`,
  `connect-src 'self'`,
  `object-src 'none'`,
  `base-uri 'none'`,
  `form-action 'self'`,
  `frame-src 'none'`,
  `frame-ancestors 'none'`,
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
if (process.env.NODE_ENV === 'production')
  securityHeaders.push({ key: 'Content-Security-Policy', value: contentSecurityPolicy })

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1'],
  // keep `next dev` from writing its managed agent-instructions block into the repo
  agentRules: false,
  // MDX images are served by Cloudinary, so next/image only builds URLs
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinaryLoader.ts',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
