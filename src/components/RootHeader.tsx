'use client'

import type { ComponentProps } from 'react'
import { clsx } from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ColorModeToggle } from '@/components/ColorModeToggle'
import { SiteLogo } from '@/components/svgs/SiteLogo'
import { site } from '@/lib/site'

type RootHeaderProps = ComponentProps<'header'>

export function RootHeader({
  className,
  ...props
}: RootHeaderProps) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  // category pages belong to the Posts section
  const isPosts = pathname.startsWith('/posts') || pathname.startsWith('/categories')
  const logoTranslation = isHome ? 'md:translate-x-[7.5rem]' : ''

  return (
    <header
      {...props}
      className={clsx(
        'flex items-center justify-between',
        className,
      )}
    >
      {/* site logo */}
      {/* the site's one designed motion: the logo glides over on the home page */}
      <div className={clsx('pr-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', logoTranslation)}>
        <Link
          href="/"
          tabIndex={-1}
          aria-label={site.domain}
        >
          {/* logo svg imported as component */}
          <SiteLogo
            className="h-6 text-teal-700 dark:text-teal-800"
            aria-hidden
          />
        </Link>
      </div>

      {/* nav links */}
      <nav
        className="flex items-center justify-end"
      >
        <NavLink
          href="/"
          isSelected={isHome}
          aria-current={isHome ? 'page' : undefined}
        >
          Home
        </NavLink>

        <NavLink
          href="/posts"
          isSelected={isPosts}
          aria-current={isPosts
            ? (pathname === '/posts'
                ? 'page'
                : 'true')
            : undefined}
        >
          Posts
        </NavLink>

        <ColorModeToggle className="ml-2" />
      </nav>
    </header>
  )
}

type NavLinkProps = ComponentProps<typeof Link> & {
  isSelected: boolean
  children: React.ReactNode
}

function NavLink({
  isSelected,
  className,
  children,
  ...props
}: NavLinkProps) {
  return (
    <Link
      {...props}
      className={clsx(
        'inline-block rounded-md px-4 py-2 text-sm font-semibold underline',
        'text-zinc-600 hover:text-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100',
        {
          'bg-zinc-200 dark:bg-zinc-800': isSelected,
        },
        'transition-[color] duration-200', // only text color transition, not bg color
        className,
      )}
    >
      {children}
    </Link>
  )
}
