import { z } from 'zod'
import { authorComponents } from '@/components/mdx/MdxComponents'
import { DISPLAY_TIME_ZONE } from '@/lib/constants'

// What the content engine checks posts against before it syncs them: the
// display time zone its dates must be anchored to, and the components a
// post may use with each one's attributes (JSON Schema of the input) and
// whether it takes content. Built from the same table the renderer checks,
// at build time, without the API. The content engine reads only the keys it
// knows, so keys may be added here but never changed.
export const dynamic = 'force-static'

export function GET(): Response {
  return Response.json({
    timeZone: DISPLAY_TIME_ZONE,
    mdx: {
      components: Object.fromEntries(Object.entries(authorComponents).map(([name, { attributes, children }]) => [
        name,
        {
          attributes: z.toJSONSchema(attributes, { io: 'input' }),
          children,
        },
      ])),
    },
  })
}
