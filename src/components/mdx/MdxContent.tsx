import { compileMdxContent } from '@/lib/mdx'

import '@/styles/mdx.tailwind.css'

type MdxContentProps = {
  source: string
}

export async function MdxContent({ source }: MdxContentProps) {
  const { content } = await compileMdxContent(source)

  return <div className="mdx">{content}</div>
}
