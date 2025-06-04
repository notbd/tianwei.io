'use client'

import type { LinkProps } from 'next/link'
import type { ComponentProps } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ColorModeToggle } from '@/components/ColorModeToggle'
import { SiteLogo } from '@/components/svgs'
import { cn } from '@/lib/utils'

type PageHeaderProps = ComponentProps<'header'>

export function RootHeader({
  className,
  ...props
}: PageHeaderProps) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isBlog = pathname.startsWith('/posts')
  const logoTranslation = isHome ? 'md:translate-x-[7.5rem]' : ''

  return (
    <header
      {...props}
      className={cn(
        'flex items-center justify-between',
        className,
      )}
    >
      {/* site logo */}
      <div className={`pr-4 transition ease-out ${logoTranslation}`}>
        <Link
          href="/"
          tabIndex={-1}
        >
          {/* logo svg imported as component */}
          <SiteLogo
            className="h-6 text-teal-700 dark:text-teal-800"
            aria-label="TWZ Website Logo"
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
        >
          Home
        </NavLink>

        <NavLink
          href="/posts"
          isSelected={isBlog}
        >
          Blog
        </NavLink>

        <ColorModeToggle className="ml-2" />
      </nav>
    </header>
  )
}

type NavLinkProps = ComponentProps<'a'> & LinkProps & {
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
      className={cn(
        'inline-block rounded-md px-4 py-2 text-sm font-semibold underline',
        'text-zinc-600 hover:text-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100',
        {
          'bg-zinc-200 dark:bg-zinc-800': isSelected,
        },
        'transition-[color] duration-300', // only text color transition, not bg color
        className,
      )}
    >
      {children}
    </Link>
  )
}
