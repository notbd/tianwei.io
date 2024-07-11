import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'About Tianwei Zhang',
}

export default function About() {
  return (
    <div>
      <h1>About</h1>
      <p>This page is still under construction :)</p>
    </div>
  )
}
