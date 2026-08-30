import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
async function login(p,e){ await p.goto(BASE+'/login',{waitUntil:'domcontentloaded'}); await p.fill('input[type="email"]',e); await p.fill('input[type="password"]',PASS); await p.click('button[type="submit"]'); await p.waitForURL('**/dashboard',{timeout:15000}); await p.waitForTimeout(1000)}
const browser=await chromium.launch()
const ctx=await browser.newContext()
const page=await ctx.newPage()
await login(page,'marketing@csm.app')
// Test empty client creation via UI modal
await page.goto(BASE+'/dashboard',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(800)
const btn=page.getByRole('button',{name:'Client Onboarding'})
await btn.click(); await page.waitForTimeout(600)
await page.click('button[type="submit"]'); await page.waitForTimeout(800)
let html=await page.textContent('body')
console.log('Empty client submit shows validation?', html.includes('required') || html.includes('Required') || html.includes('2 characters') ? 'YES' : 'NO - checking form stays open')
console.log('Modal still open after empty submit?', html.includes('Client Onboarding') && html.includes('Company'))
await page.keyboard.press('Escape'); await page.waitForTimeout(500)
// Test invalid email
await btn.click(); await page.waitForTimeout(600)
await page.fill('input[name="companyName"]','Test Co')
await page.fill('input[name="email"]','not-an-email')
await page.click('button[type="submit"]'); await page.waitForTimeout(1000)
html=await page.textContent('body')
console.log('Invalid email shows error?', html.includes('email') && html.includes('Invalid') ? 'YES' : 'checking toast or stays')
await page.keyboard.press('Escape'); await page.waitForTimeout(500)

// Test task creation empty title
await login(page,'taskmanager@csm.app')
await page.goto(BASE+'/tasks',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(1000)
await page.locator('main').getByRole('button',{name:'Create Task'}).click(); await page.waitForTimeout(600)
await page.click('button[type="submit"]'); await page.waitForTimeout(800)
html=await page.textContent('body')
console.log('Empty task submit blocked?', html.includes('Create Task') ? 'YES modal still open (validation)' : 'NO')
await page.keyboard.press('Escape'); await page.waitForTimeout(500)

// Test duplicate submission guard: click twice quickly
await page.locator('main').getByRole('button',{name:'Create Task'}).click(); await page.waitForTimeout(600)
await page.fill('input[name="title"]','Dup Test')
const projSel=page.locator('select[name="projectId"]')
if(await projSel.count()){
  const opts=await projSel.evaluate(s=>Array.from(s.options).map(o=>o.value).filter(v=>v))
  if(opts.length) await projSel.selectOption(opts[0])
}
const subBtn=page.locator('form').getByRole('button',{name:'Create'})
await subBtn.click(); await page.waitForTimeout(200)
console.log('Second click disabled while loading?', await subBtn.isDisabled() ? 'YES' : 'NO (but may be guard)')
await page.waitForTimeout(1500)
await page.keyboard.press('Escape'); await page.waitForTimeout(500)

// Test invalid login
const ctx2=await browser.newContext()
const p2=await ctx2.newPage()
await p2.goto(BASE+'/login',{waitUntil:'domcontentloaded'})
await p2.fill('input[type="email"]','wrong@test.com')
await p2.fill('input[type="password"]','wrong')
await p2.click('button[type="submit"]'); await p2.waitForTimeout(1500)
let body2=await p2.textContent('body')
console.log('Invalid login shows error?', body2.includes('Invalid') || body2.includes('credentials') || body2.includes('Error') ? 'YES' : 'NO snippet '+body2.slice(0,150))
await ctx2.close()
await ctx.close()
await browser.close()
