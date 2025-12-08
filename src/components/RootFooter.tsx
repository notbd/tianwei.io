'use client'

import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'
import { ExternalLink } from '@/components/ExternalLink'
import { Subscript } from '@/components/Subscript'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

type PageFooterProps = ComponentProps<'footer'>

export function RootFooter({
  className,
  ...props
}: PageFooterProps) {
  const [isMounted, setIsMounted] = useState(false)
  const isAboveMd = useMediaQuery('(min-width: 48rem)')
  const isMountedAndAboveMd = isMounted && isAboveMd === true

  useEffect(() => {
    queueMicrotask(() => setIsMounted(true))
  }, [])

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
              'transition duration-200 ease-out',
              'translate-x-0 opacity-100',
              'md:pointer-events-none md:translate-x-4 md:opacity-0',
            )}
          >

            <FooterSegment>
              {'Content licensed under '}

              <ExternalLink
                href="https://creativecommons.org/licenses/by-nc-sa/4.0"
                tabIndex={isMountedAndAboveMd ? -1 : 0}
                aria-hidden={isMountedAndAboveMd}
              >
                CC BY-NC-SA 4.0
              </ExternalLink>

              .
            </FooterSegment>

            <FooterSegment>
              {'Source code licensed under '}

              <ExternalLink
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                tabIndex={isMountedAndAboveMd ? -1 : 0}
                aria-hidden={isMountedAndAboveMd}
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
              tabIndex={!isMountedAndAboveMd ? -1 : 0}
              aria-hidden={!isMountedAndAboveMd}
            >
              CC BY-NC-SA 4.0
            </ExternalLink>

            <Subscript className="text-[0.625rem] leading-3.5">
              {' (content)'}
            </Subscript>

            {' & '}

            <ExternalLink
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              tabIndex={!isMountedAndAboveMd ? -1 : 0}
              aria-hidden={!isMountedAndAboveMd}
            >
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
          tianwei.io · &copy; 2024-present · Tianwei Zhang
        </FooterSegment>

      </div>
    </footer>
  )
  // )
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
