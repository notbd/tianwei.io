import type { ComponentProps } from 'react'
import { Fragment } from 'react'
import { ExternalLink } from '@/components/ExternalLink'
import { JsonLd } from '@/components/JsonLd'
import { SubscriptBlock } from '@/components/Subscript'
import { SITE_URL } from '@/lib/paths'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

// home page
export default function Home() {
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': site.name,
        'url': SITE_URL,
        'email': `mailto:${site.email}`,
        'sameAs': site.profiles.map(profile => profile.url),
      }}
      />

      {/* page heading for assistive tech; the name section below is visual only */}
      <h1 className="sr-only">{site.name}</h1>

      {/* Name */}
      <HomeSection id="name" className="flex flex-row" aria-hidden>
        {/* md: first name */}
        <HomeSectionHeader className="hidden font-semibold md:block">
          Tianwei
        </HomeSectionHeader>

        {/* md: last name */}
        <HomeSectionBody className="hidden font-bold text-teal-700 md:flex">
          Zhang
        </HomeSectionBody>

        {/* below md: full name */}
        <HomeSectionBody className="pl-0 font-semibold text-zinc-500 md:hidden dark:text-zinc-200">
          Tianwei
          <span className="font-bold text-teal-700">
            {' Zhang'}
          </span>
        </HomeSectionBody>
      </HomeSection>

      {/* Projects */}
      <HomeSection id="projects">
        <HomeSectionHeader>
          Projects
        </HomeSectionHeader>

        <HomeSectionBody>
          <ul>

            {/* ikalendar2 */}
            <li className="pb-3">
              <ExternalLink href="https://ikalendar.app">
                ikalendar2
              </ExternalLink>
              {/* the App Store version, bumped by hand on each release */}
              <span className="pl-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                v2.4.0
              </span>

              <SubscriptBlock>
                Open-source SwiftUI app tracking Splatoon 2 rotations
              </SubscriptBlock>
            </li>

            {/* SimpleHaptics */}
            <li className="pb-3">
              <ExternalLink href="https://github.com/notbd/SimpleHaptics">
                SimpleHaptics
              </ExternalLink>

              <SubscriptBlock>
                Swift package for simple haptic feedback on iOS
              </SubscriptBlock>
            </li>

          </ul>
        </HomeSectionBody>
      </HomeSection>

      {/* Currently */}
      <HomeSection id="currently">
        <HomeSectionHeader>
          Currently
        </HomeSectionHeader>

        <HomeSectionBody>
          <ul>

            {/* Five Continents International */}
            <li className="pb-3">
              <ExternalLink href="https://fivecontinentsintl.com/">
                Five Continents International
              </ExternalLink>
              , Business Systems Analyst
            </li>

          </ul>
        </HomeSectionBody>
      </HomeSection>

      {/* Previously */}
      <HomeSection id="previously">
        <HomeSectionHeader>
          Previously
        </HomeSectionHeader>

        <HomeSectionBody>
          <ul>

            {/* Toronto */}
            <li className="pb-3">
              <ExternalLink href="https://www.ece.utoronto.ca/">
                Toronto
              </ExternalLink>
              , Computer Engineering

              <SubscriptBlock>
                Master of Engineering, School of Graduate Studies
              </SubscriptBlock>
            </li>

            {/* ECE244 */}
            <li className="pb-3">
              <ExternalLink href="https://engineering.calendar.utoronto.ca/course/ece244h1">
                ECE244
              </ExternalLink>
              , Graduate Teaching Assistant

              <SubscriptBlock>
                Programming Fundamentals, Fall 2022
              </SubscriptBlock>
            </li>

            {/* Illinois */}
            <li className="pb-3">
              <ExternalLink href="https://cs.illinois.edu/">
                Illinois
              </ExternalLink>
              , Computer Science

              <SubscriptBlock>
                Bachelor of Science, The Grainger College of Engineering
              </SubscriptBlock>
            </li>

          </ul>
        </HomeSectionBody>
      </HomeSection>

      {/* Links */}
      <HomeSection id="links">
        <HomeSectionHeader>
          Links
        </HomeSectionHeader>

        <HomeSectionBody>
          {site.profiles.map(profile => (
            <Fragment key={profile.label}>
              <ExternalLink href={profile.url}>
                {profile.label}
              </ExternalLink>
              {', '}
            </Fragment>
          ))}
          <ExternalLink href={`mailto:${site.email}`}>
            Email
          </ExternalLink>
        </HomeSectionBody>
      </HomeSection>
    </>
  )
}

type HomeSectionProps = ComponentProps<'section'> & {
  id: string
  children: React.ReactNode
}

function HomeSection({
  id,
  className,
  children,
  ...props
}: HomeSectionProps) {
  return (
    <section
      id={id}
      className={cn('flex flex-col pb-5 text-xl md:flex-row', className)}
      {...props}
    >
      {children}
    </section>
  )
}

type HomeSectionHeaderProps = ComponentProps<'h2'> & { children: React.ReactNode }

function HomeSectionHeader({
  className,
  children,
  ...props
}: HomeSectionHeaderProps) {
  return (
    <h2
      {...props}
      className={cn(
        'text-zinc-500 md:w-32 md:text-right dark:text-zinc-200',
        className,
      )}
    >
      {children}
    </h2>
  )
}

type HomeSectionBodyProps = ComponentProps<'div'> & { children: React.ReactNode }

function HomeSectionBody({
  className,
  children,
  ...props
}: HomeSectionBodyProps) {
  return (
    <div
      {...props}
      className={cn(
        'grow pl-2 font-semibold transition-[padding] duration-300 ease-out md:pl-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
