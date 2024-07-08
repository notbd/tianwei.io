'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import type { ComponentProps } from 'react'
import { SiteLogo } from '@/components/svgs'
import { cn } from '@/lib/utils'

export function PageHeader() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isAbout = pathname === '/about'
  const logoTranslation = isHome ? 'md:translate-x-[7.5rem]' : 'md:translate-x-0'

  return (
    <header
      className="flex items-center justify-between"
    >
      {/* site logo */}
      <div className={`pr-4 transition-transform ease-out ${logoTranslation}`}>
        <Link
          href="/"
          tabIndex={-1}
        >
          {/* logo svg imported as component */}
          <SiteLogo
            className="h-6 text-black dark:text-teal-800"
            aria-label="TWZ Website Logo"
          />
        </Link>
      </div>

      {/* nav links */}
      <nav>
        <ul className="flex justify-end gap-x-1">
          <li>
            <NavLink
              href="/"
              isSelected={isHome}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              href="/about"
              isSelected={isAbout}
            >
              About
            </NavLink>
          </li>
        </ul>
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
        'inline-block rounded-md px-4 py-2 text-sm font-semibold underline transition',
        'text-zinc-600 hover:text-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100',
        {
          'bg-zinc-50 dark:bg-zinc-700': isSelected,
        },
        className,
      )}
    >
      {children}
    </Link>
  )
}
