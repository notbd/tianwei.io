import type { NextConfig } from 'next'

// Conservative security headers. A strict CSP is deliberately omitted:
// it would have to account for the inline theme scripts and MDX-rendered
// content, and the payoff on a static content site is small.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

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
  // the OG image route reads its fonts at render time (fs, not import)
  outputFileTracingIncludes: {
    '/opengraph-image': ['./src/styles/fonts/sources/rubik-*.woff'],
    '/posts/[slug]/opengraph-image': ['./src/styles/fonts/sources/rubik-*.woff'],
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
