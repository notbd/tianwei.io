import type { ComponentProps } from 'react'
import { ExternalLink } from '@/components/ExternalLink'
import { Subscript } from '@/components/Subscript'
import { cn } from '@/lib/utils'

type PageFooterProps = ComponentProps<'footer'>

// The two license messages cross-fade at the md breakpoint. The inactive one
// is hidden with `visibility` as well as opacity: that keeps it out of the
// tab order and the accessibility tree while still letting the fade run,
// so no JavaScript is needed to juggle tabIndex/aria-hidden.
export function RootFooter({
  className,
  ...props
}: PageFooterProps) {
  return (
    <footer
      {...props}
      className={cn('mt-32 flex items-end justify-start md:justify-center', className)}
    >
      <div
        className="flex flex-col items-start md:items-center"
      >
        {/* container for license messages */}
        <div className="relative">

          {/* below md width: separate content and source code license msg */}
          <div
            className={cn(
              'absolute bottom-0',
              'transition-[opacity,translate,visibility] duration-200 ease-out motion-reduce:transition-none',
              'visible translate-x-0 opacity-100',
              'md:invisible md:translate-x-4 md:opacity-0',
            )}
          >

            <FooterSegment>
              {'Content licensed under '}

              <ExternalLink href="https://creativecommons.org/licenses/by-nc-sa/4.0">
                CC BY-NC-SA 4.0
              </ExternalLink>

              .
            </FooterSegment>

            <FooterSegment>
              {'Source code licensed under '}

              <ExternalLink href="https://www.gnu.org/licenses/agpl-3.0.html">
                AGPLv3
              </ExternalLink>

              .
            </FooterSegment>
          </div>

          {/* above md width: combined license msg */}
          <FooterSegment
            className={cn(
              'transition-[opacity,translate,visibility] duration-200 ease-out motion-reduce:transition-none',
              'invisible -translate-x-4 opacity-0',
              'md:visible md:translate-x-0 md:opacity-100',
            )}
          >
            {'Licensed under '}

            <ExternalLink href="https://creativecommons.org/licenses/by-nc-sa/4.0">
              CC BY-NC-SA 4.0
            </ExternalLink>

            <Subscript className="text-[0.625rem] leading-3.5">
              {' (content)'}
            </Subscript>

            {' & '}

            <ExternalLink href="https://www.gnu.org/licenses/agpl-3.0.html">
              AGPLv3
            </ExternalLink>

            <Subscript className="text-[0.625rem] leading-3.5">
              {' (source code)'}
            </Subscript>

            .
          </FooterSegment>
        </div>

        {/* copyright msg */}
        <FooterSegment>
          tianwei.io · &copy; 2024-present ·
          {' '}
          <span className="whitespace-nowrap">Tianwei Zhang</span>
        </FooterSegment>

      </div>
    </footer>
  )
}

type FooterSegmentProps = ComponentProps<'p'> & { children: React.ReactNode }

function FooterSegment({
  className,
  children,
  ...props
}: FooterSegmentProps) {
  return (
    <p
      {...props}
      className={cn('text-sm text-zinc-500 dark:text-zinc-400', className)}
    >
      {children}
    </p>
  )
}
