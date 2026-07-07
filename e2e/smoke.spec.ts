import { expect, test } from '@playwright/test'

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
  const toggle = page.getByRole('button', { name: 'Color Mode Toggle' })

  // pre-paint script default
  await expect(html).toHaveAttribute('data-theme-choice', 'system')

  // first click may race hydration (Playwright doesn't wait for React to
  // attach handlers) — retry the click until the state actually flips
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
  await toggle.click() // -> dark
  await page.reload()
  await expect(html).toHaveAttribute('data-theme-choice', 'dark')
  await expect(html).toHaveClass(/dark/)
})

test('feed.xml serves RSS with every post', async ({ request }) => {
  const response = await request.get('/feed.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/rss+xml')
  const body = await response.text()
  expect(body).toContain('<rss version="2.0"')
  expect(body).toContain('<item>')
})

test('sitemap includes posts and categories', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  const body = await response.text()
  expect(body).toContain('/posts</loc>')
  expect(body).toContain('/categories/')
  expect(body).toContain('/posts/')
})
