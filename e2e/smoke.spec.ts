import type { APIRequestContext } from '@playwright/test'
import { test as base, expect } from '@playwright/test'

// Every page a test opens reports Content-Security-Policy violations back
// to the test process, and the test fails if there were any: the policy
// must not block anything the site itself does. (Init scripts and exposed
// bindings run outside the page's CSP.)
const test = base.extend<{ cspViolations: string[] }>({
  cspViolations: [
    async ({ page }, use) => {
      const violations: string[] = []
      await page.exposeBinding('reportCspViolation', (_source, violation: string) => {
        violations.push(violation)
      })
      await page.addInitScript({
        content: `document.addEventListener('securitypolicyviolation', event => {
        window.reportCspViolation(event.violatedDirective + ' blocked ' + event.blockedURI + ' on ' + location.pathname)
      })`,
      })
      await use(violations)
      expect(violations).toEqual([])
    },
    { auto: true },
  ],
})

/** Paths of the sitemap's URLs that start with `prefix`, in sitemap order. */
async function sitemapPaths(request: APIRequestContext, prefix: string): Promise<string[]> {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  return [
    ...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g),
  ]
    .flatMap(([, url]) => url === undefined
      ? []
      : [new URL(url).pathname])
    .filter(path => path.startsWith(prefix))
}

test('home page renders with header navigation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Posts' })).toBeVisible()
})

test('posts index lists articles and navigates to a post', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Posts' }).click()
  await expect(page).toHaveURL(/\/posts$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Posts' })).toBeVisible()

  const firstPost = page.locator('main ul li a').first()
  await expect(firstPost).toBeVisible()
  await firstPost.click()

  // a post page renders its title and MDX body
  await expect(page).toHaveURL(/\/posts\/[a-z0-9-]+$/)
  await expect(page.locator('main h1')).toBeVisible()
  await expect(page.locator('main p').first()).toBeVisible()
})

test('theme toggle cycles system -> dark -> light without flash-prone state', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  const toggle = page.getByRole('button', { name: /color theme/i })

  // pre-paint script default
  await expect(html).toHaveAttribute('data-theme-choice', 'system')

  // first click may race hydration (Playwright doesn't wait for React to
  // attach handlers), so retry the click until the state actually flips
  await expect(async () => {
    await toggle.click()
    await expect(html).toHaveAttribute('data-theme-choice', 'dark', { timeout: 1000 })
  }).toPass({ timeout: 10_000 })
  await expect(html).toHaveClass(/dark/)

  await toggle.click()
  await expect(html).toHaveAttribute('data-theme-choice', 'light')
  await expect(html).not.toHaveClass(/dark/)

  await toggle.click()
  await expect(html).toHaveAttribute('data-theme-choice', 'system')

  // the choice survives a reload via localStorage + pre-paint script
  // (the switch lands a frame after the click, inside the view transition)
  await toggle.click() // -> dark
  await expect(html).toHaveAttribute('data-theme-choice', 'dark')
  await page.reload()
  await expect(html).toHaveAttribute('data-theme-choice', 'dark')
  await expect(html).toHaveClass(/dark/)
})

test('unknown post, malformed slug, category and path all 404 with the not-found title', async ({ request }) => {
  // the API answers 400 for 'Not-A-Slug'; the page must 404 it like an unknown slug, not 500
  const paths = [
    '/posts/this-post-does-not-exist',
    '/posts/Not-A-Slug',
    '/categories/not-a-real-category',
    '/this-page-does-not-exist',
  ]
  for (const path of paths) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(404)
    expect(await response.text(), path).toContain('<title>Page Not Found · tianwei.io</title>')
  }
})

test('an unmatched URL renders the not-found page server-side inside the layout', async ({ request }) => {
  // notFound() from the post/category pages cannot be asserted this way: without
  // Cache Components, Next 16 ships a bare shell for it and renders the boundary
  // on the client (see src/app/not-found.tsx)
  const body = await (await request.get('/this-page-does-not-exist')).text()
  expect(body).not.toContain('__next_error__')
  expect(body).toContain('<h1')
  expect(body).toContain('Page Not Found')
})

test('feed.xml serves RSS with every post', async ({ request }) => {
  const response = await request.get('/feed.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/rss+xml')
  const body = await response.text()
  expect(body).toContain('<rss version="2.0"')

  // the sitemap lists every post from the same data with the same URL
  // builder, so each of its post URLs must be an item link here
  const sitemap = await (await request.get('/sitemap.xml')).text()
  const postUrls = sitemap.match(/https:\/\/[^<]+\/posts\/[^<]+(?=<\/loc>)/g) ?? []
  expect(postUrls.length).toBeGreaterThan(0)
  for (const url of postUrls)
    expect(body, url).toContain(`<link>${url}</link>`)
})

test('a code block copy button copies the code and confirms it', async ({ page, context, request }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  // the first post with a code block in its body
  const block = page.locator('[data-code-block]').first()
  for (const path of await sitemapPaths(request, '/posts/')) {
    await page.goto(path)
    if (await block.count() > 0)
      break
  }
  await expect(block, 'no post has a code block').toBeVisible()

  const button = block.getByRole('button', { name: 'Copy code' })
  await block.hover()
  // first click may race hydration, as in the theme test
  await expect(async () => {
    await button.click()
    await expect(block.getByRole('button', { name: 'Copied' })).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 10_000 })

  const copied = await page.evaluate(async () => navigator.clipboard.readText())
  expect(copied).toBe(await block.locator('pre').textContent())
  expect(copied.length).toBeGreaterThan(0)
})

test('category pages count as the Posts section in the header', async ({ page, request }) => {
  const [category] = await sitemapPaths(request, '/categories/')
  if (category === undefined)
    throw new Error('the sitemap lists no category')
  await page.goto(category)
  const nav = page.locator('header nav')
  await expect(nav.getByRole('link', { name: 'Posts', exact: true })).toHaveAttribute('aria-current', 'true')
  await expect(nav.getByRole('link', { name: 'Home', exact: true })).not.toHaveAttribute('aria-current')
})

test('production responses carry the baseline Content-Security-Policy', async ({ request }) => {
  const response = await request.get('/')
  expect(response.headers()['content-security-policy']).toBe([
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `form-action 'self'`,
    `frame-src 'none'`,
    `frame-ancestors 'none'`,
  ].join('; '))
})
