import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { SITE_LOGO_PATH } from '@/components/svgs/siteLogoPath'
import { site } from '@/lib/site'

export const OG_SIZE = { width: 1200, height: 630 }

// The site's own face, Rubik (SIL OFL, from @fontsource/rubik 5.3.0): satori
// reads TTF/OTF/WOFF, not the woff2 next/font serves, and without a font it
// falls back to a single regular weight, so bold titles came out thin.
// next.config.ts traces these files into the on-demand renders' bundles.
const FONT_DIR = join(process.cwd(), 'src/styles/fonts/sources')

type OgCardProps = {
  title: string
  description: string | null
  /** Left and right of the bottom line, e.g. the author and the date. */
  footer?: [string, string]
}

/** The 1200×630 link-preview card: the TZ mark and domain, a title, a description, a footer. */
export async function ogCard({ title, description, footer }: OgCardProps): Promise<ImageResponse> {
  const [regular, bold] = await Promise.all([
    readFile(join(FONT_DIR, 'rubik-latin-400-normal.woff')),
    readFile(join(FONT_DIR, 'rubik-latin-700-normal.woff')),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          backgroundColor: '#09090b', // zinc-950
          color: '#fafafa', // zinc-50
          fontFamily: 'Rubik',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* the header's TZ mark, in teal-600 for the dark card */}
          <svg viewBox="0 0 2000 1171" width={61} height={36} fill="#009689">
            <path d={SITE_LOGO_PATH} />
          </svg>
          <div style={{ fontSize: 32, color: '#a1a1aa' }}>{site.domain}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: title.length > 48
                ? 56
                : 68,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          {description !== null && (
            <div style={{ fontSize: 30, color: '#a1a1aa', lineHeight: 1.4 }}>
              {description.length > 120
                ? `${description.slice(0, 117)}...`
                : description}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 26,
          color: '#a1a1aa', // 7.8:1 on the card, readable when it is shown small
        }}
        >
          <div>{footer?.[0]}</div>
          <div>{footer?.[1]}</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        {
          name: 'Rubik',
          data: regular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Rubik',
          data: bold,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  )
}
