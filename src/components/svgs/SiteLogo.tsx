import type { ComponentProps } from 'react'
import { SITE_LOGO_PATH } from './siteLogoPath'

type SvgProps = ComponentProps<'svg'>

export function SiteLogo(props: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 2000 1171"
      {...props}
    >
      <path d={SITE_LOGO_PATH} />
    </svg>
  )
}
