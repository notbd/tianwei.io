import type { ComponentProps } from 'react'
import { ExternalLink } from '@/components/ExternalLink'
import { SubscriptBlock } from '@/components/Subscript'
import { cn } from '@/lib/utils'

// home page
export default function Home() {
  return (
    <>
      {/* page heading for assistive tech; the name section below is visual only */}
      <h1 className="sr-only">Tianwei Zhang</h1>

      {/* Name */}
      <HomeSection id="name" className="flex flex-row" aria-hidden>
        {/* md: first name */}
        <HomeSectionHeader className="hidden font-semibold md:block">
          Tianwei
        </HomeSectionHeader>

        {/* md: last name */}
        <HomeSectionBody className="hidden font-bold text-teal-700 transition-colors duration-500 md:flex">
          Zhang
        </HomeSectionBody>

        {/* below md: full name */}
        <HomeSectionBody className="pl-0 font-semibold text-zinc-500 transition-colors duration-500 md:hidden dark:text-zinc-200">
          Tianwei
          <span className="font-bold text-teal-700 transition-colors duration-500">
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

              <SubscriptBlock>
                SwiftUI app for tracking Splatoon 2 in-game rotations
              </SubscriptBlock>
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

          {/* github */}
          <ExternalLink href="https://github.com/notbd">
            GitHub
          </ExternalLink>
          {', '}

          {/* linkedin */}
          <ExternalLink href="https://linkedin.com/in/tianwei-z">
            LinkedIn
          </ExternalLink>
          {', '}

          {/* instagram */}
          <ExternalLink href="https://instagram.com/zhang13music">
            Instagram
          </ExternalLink>
          {', '}

          {/* twitter */}
          <ExternalLink href="https://twitter.com/defnotbd">
            Twitter
          </ExternalLink>
          {', '}

          {/* email */}
          <ExternalLink href="mailto:hello@tianwei.io">
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
