import { chromium } from 'playwright'
const BASE = 'http://localhost:3000'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', 'admin@csm.app')
await page.fill('input[type="password"]', 'Password123!')
await page.click('button[type="submit"]')
await page.waitForURL('**/dashboard', { timeout: 15000 })
await page.waitForTimeout(1500)
const info = await page.evaluate(() => {
  const nav = document.querySelector('nav')
  const aside = document.querySelector('aside')
  const buttons = Array.from(document.querySelectorAll('nav button, aside button')).map((b) => (b.textContent || '').trim().replace(/\s+/g,' ').slice(0,40))
  return {
    navHtml: nav ? nav.outerHTML.slice(0, 2500) : 'NO NAV',
    asideHtml: aside ? aside.outerHTML.slice(0, 2500) : 'NO ASIDE',
    navButtons: buttons,
  }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
