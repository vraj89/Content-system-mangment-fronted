import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://localhost:3000'
const OUT = 'D:/Internship tasks/CSM/frontend/qa-out'
fs.mkdirSync(OUT, { recursive: true })

const ROLES = [
  { role: 'ADMIN', email: 'admin@csm.app' },
  { role: 'MARKETING', email: 'marketing@csm.app' },
  { role: 'TASK_MANAGEMENT', email: 'taskmanager@csm.app' },
  { role: 'CONTENT_TEAM', email: 'content@csm.app' },
  { role: 'MEDIA_TEAM', email: 'media@csm.app' },
  { role: 'CLIENT', email: 'client@csm.app' },
]
const PASS = 'Password123!'

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

async function run() {
  const browser = await chromium.launch()
  const results = []

  for (const { role, email } of ROLES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const consoleErrors = []
    const pageErrors = []
    const failed = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    page.on('pageerror', (e) => pageErrors.push(e.message))
    page.on('response', (r) => { const s = r.status(); if (s >= 400) failed.push(`${r.request().method()} ${r.url()} -> ${s}`) })

    const roleResult = { role, email, links: [], consoleErrors: [], pageErrors: [], failed: [], perLink: [] }
    try {
      await login(page, email)
      const links = await page.$$eval('nav button', (els) =>
        els.map((e) => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50)).filter(Boolean)
      )
      roleResult.links = links
      for (const label of links) {
        try {
          const before = page.url()
          await page.getByRole('button', { name: label, exact: true }).first().click({ timeout: 8000 })
          await page.waitForTimeout(900)
          const after = page.url()
          const bodyLen = ((await page.textContent('body')) || '').length
          const errText = await page.evaluate(() => {
            const t = document.body.innerText || ''
            if (/something went wrong|unable to load|not found|error loading|failed to load/i.test(t)) return t.slice(0, 200)
            return ''
          })
          roleResult.perLink.push({ label, before, after, bodyLen, errText })
        } catch (e) {
          roleResult.perLink.push({ label, error: e.message.slice(0, 120) })
        }
      }
    } catch (e) {
      roleResult.pageErrors.push(`LOGIN/SETUP FAIL: ${e.message}`)
    }
    roleResult.consoleErrors = consoleErrors
    roleResult.pageErrors = roleResult.pageErrors.concat(pageErrors)
    roleResult.failed = failed
    results.push(roleResult)
    await ctx.close()
  }

  await browser.close()

  let report = '=== QA ROLE SIDEBAR REPORT ===\n'
  for (const r of results) {
    report += `\n--- ${r.role} (${r.email}) ---\n`
    report += `Sidebar items: ${r.links.length}: ${r.links.join(' | ')}\n`
    for (const pl of r.perLink) {
      if (pl.error) report += `  [ERR] ${pl.label}: ${pl.error}\n`
      else if (pl.errText) report += `  [ERRTXT] ${pl.label}: ${pl.errText}\n`
      else report += `  [ok] ${pl.label}  url=${pl.after.replace(BASE,'')} len=${pl.bodyLen}\n`
    }
    if (r.consoleErrors.length) report += `Console errors (${r.consoleErrors.length}):\n` + r.consoleErrors.slice(0, 20).map((e) => '  - ' + e).join('\n') + '\n'
    if (r.pageErrors.length) report += `Page errors (${r.pageErrors.length}):\n` + r.pageErrors.slice(0, 20).map((e) => '  - ' + e).join('\n') + '\n'
    if (r.failed.length) report += `4xx (${r.failed.length}):\n` + r.failed.slice(0, 30).map((e) => '  - ' + e).join('\n') + '\n'
  }
  fs.writeFileSync(`${OUT}/role-report.txt`, report)
  console.log(report)
}

run().catch((e) => { console.error(e); process.exit(1) })
