'use client'

import type { ComponentProps } from 'react'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { Subscript } from '@/components/Subscript'
import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/ExternalLink'

type PageFooterProps = ComponentProps<'footer'>

export function RootFooter({
  className,
  ...props
}: PageFooterProps) {
  const isAboveMd = useMediaQuery('(min-width: 48rem)')

  return (
    <footer
      {...props}
      className={cn('flex items-end justify-start px-4 pt-16 md:justify-center', className)}
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
              'transition duration-200 ease-out',
              'translate-x-0 opacity-100',
              'md:pointer-events-none md:translate-x-4 md:opacity-0',
            )}
          >

            <FooterSegment>
              {'Content licensed under '}

              <ExternalLink
                href="https://creativecommons.org/licenses/by-nc-sa/4.0"
                tabIndex={isAboveMd ? -1 : 0}
                aria-hidden={isAboveMd}
              >
                CC BY-NC-SA 4.0
              </ExternalLink>

              .
            </FooterSegment>

            <FooterSegment>
              {'Source code licensed under '}

              <ExternalLink
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                tabIndex={isAboveMd ? -1 : 0}
                aria-hidden={isAboveMd}
              >

                AGPLv3
              </ExternalLink>

              .
            </FooterSegment>
          </div>

          {/* above md width: combined license msg */}
          <FooterSegment
            className={cn(
              'transition duration-200 ease-out',
              'pointer-events-none -translate-x-4 opacity-0',
              'md:pointer-events-auto md:translate-x-0 md:opacity-100',
            )}
          >
            {'Licensed under '}

            <ExternalLink
              href="https://creativecommons.org/licenses/by-nc-sa/4.0"
              tabIndex={isAboveMd ? 0 : -1}
              aria-hidden={!isAboveMd}
            >
              CC BY-NC-SA 4.0
            </ExternalLink>

            <Subscript className="text-[0.625rem] leading-[0.875rem]">
              {' (content)'}
            </Subscript>

            {' & '}

            <ExternalLink
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              tabIndex={isAboveMd ? 0 : -1}
              aria-hidden={!isAboveMd}
            >
              AGPLv3
            </ExternalLink>

            <Subscript className="text-[0.625rem] leading-[0.875rem]">
              {' (source code)'}
            </Subscript>

            .
          </FooterSegment>
        </div>

        {/* copyright msg */}
        <FooterSegment>
          tianwei.io · &copy; 2024-present · Tianwei Zhang
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
