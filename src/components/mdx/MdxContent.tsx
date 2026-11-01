import { renderMdx } from '@/lib/mdx'

import '@/styles/mdx.tailwind.css'

type MdxContentProps = {
  source: string
}

export async function MdxContent({ source }: MdxContentProps) {
  return <div className="mdx">{await renderMdx(source)}</div>
}
