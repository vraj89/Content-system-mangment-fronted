import { chromium } from 'playwright'
const BASE = 'http://localhost:3000'
const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', (m) => console.log('CONSOLE', m.type(), m.text()))
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', 'admin@csm.app')
await page.fill('input[type="password"]', 'Password123!')
await page.click('button[type="submit"]')
await page.waitForURL('**/dashboard', { timeout: 15000 })
await page.waitForTimeout(1500)
console.log('URL:', page.url())
const info = await page.evaluate(() => {
  const all = document.querySelectorAll('a')
  const asides = document.querySelectorAll('aside')
  const navs = document.querySelectorAll('nav')
  return {
    aCount: all.length,
    asideCount: asides.length,
    navCount: navs.length,
    bodyClass: document.body.className,
    sample: Array.from(all).slice(0, 30).map((a) => ({ t: (a.textContent || '').trim().slice(0,30), h: a.getAttribute('href') })),
    rootHtmlLen: document.getElementById('root')?.innerHTML.length,
  }
})
console.log(JSON.stringify(info, null, 2))
await page.screenshot({ path: 'D:/Internship tasks/CSM/frontend/qa-out/admin-dash.png', fullPage: false })
await browser.close()
