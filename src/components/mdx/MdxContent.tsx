import { renderMdx } from '@/lib/mdx'
import { berkeleyMono } from '@/styles/fonts/mono'

import '@/styles/mdx.tailwind.css'

type MdxContentProps = {
  source: string
}

export async function MdxContent({ source }: MdxContentProps) {
  return <div className={`mdx wrap-break-word ${berkeleyMono.variable}`}>{await renderMdx(source)}</div>
}
