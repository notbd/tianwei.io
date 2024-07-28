import type { ComponentProps } from 'react'
import { Subscript } from '@/components/Subscript'
import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/ExternalLink'

type PageFooterProps = ComponentProps<'footer'>

export function RootFooter({
  className,
  ...props
}: PageFooterProps) {
  return (
    <footer
      {...props}
      className={cn('flex justify-start px-4 pt-16 md:justify-center', className)}
    >
      <div
        className="flex flex-col items-start md:items-center"
      >

        {/* below md width: content license msg */}
        <FooterSegment
          className={cn(
            'transition duration-200 ease-out',
            'translate-x-0 opacity-100',
            'md:pointer-events-none md:absolute md:translate-x-4 md:opacity-0',
          )}
        >
          {'Content licensed under '}

          <ExternalLink href="https://creativecommons.org/licenses/by-nc-sa/4.0">
            CC BY-NC-SA 4.0
          </ExternalLink>

          .
        </FooterSegment>

        {/* below md width: source code license msg */}
        <FooterSegment
          className={cn(
            'transition duration-200 ease-out',
            'translate-x-0 opacity-100',
            'md:pointer-events-none md:absolute md:translate-x-4 md:opacity-0',
          )}
        >
          {'Source code licensed under '}

          <ExternalLink href="https://www.gnu.org/licenses/agpl-3.0.html">
            AGPLv3
          </ExternalLink>

          .
        </FooterSegment>

        {/* above md width: combined license msg */}
        <FooterSegment
          className={cn(
            'transition duration-200 ease-out',
            'pointer-events-none absolute -translate-x-4 opacity-0',
            'md:pointer-events-auto md:relative md:translate-x-0 md:opacity-100',
          )}
        >
          {'Licensed under '}

          <ExternalLink href="https://creativecommons.org/licenses/by-nc-sa/4.0">
            CC BY-NC-SA 4.0
          </ExternalLink>

          <Subscript className="text-[0.625rem] leading-[0.875rem]">
            {' (content)'}
          </Subscript>

          {' & '}

          <ExternalLink href="https://www.gnu.org/licenses/agpl-3.0.html">
            AGPLv3
          </ExternalLink>

          <Subscript className="text-[0.625rem] leading-[0.875rem]">
            {' (source code)'}
          </Subscript>

          .
        </FooterSegment>

        {/* copyright msg */}
        <FooterSegment>
          tianwei.io · &copy; 2024-present · TIANWEI ZHANG
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
