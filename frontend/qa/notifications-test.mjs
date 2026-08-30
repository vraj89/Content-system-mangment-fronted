import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
async function login(p,e){ await p.goto(BASE+'/login',{waitUntil:'domcontentloaded'}); await p.fill('input[type="email"]',e); await p.fill('input[type="password"]',PASS); await p.click('button[type="submit"]'); await p.waitForURL('**/dashboard',{timeout:15000}); await p.waitForTimeout(1000)}
const browser=await chromium.launch()
for(const {role,email} of [{role:'ADMIN',email:'admin@csm.app'},{role:'CONTENT',email:'content@csm.app'},{role:'CLIENT',email:'client@csm.app'}]){
  const ctx=await browser.newContext()
  const page=await ctx.newPage()
  await login(page,email)
  await page.goto(BASE+'/notifications',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(1000)
  const body=await page.textContent('body')
  console.log(`${role} notifications len=${body.length} has items? ${body.includes('No notifications')?'empty': body.includes('Client') || body.includes('Content') || body.includes('Task') ? 'has data' : 'unknown'}`)
  const bell=page.locator('header').locator('button').first()
  const bellCount=await page.evaluate(()=>{
    const el=document.querySelector('header')
    return el ? el.innerHTML.slice(0,500) : ''
  })
  console.log(`  bell exists? ${bellCount.includes('Bell') || bellCount.includes('bell') ? 'yes' : 'check'}`)
  await ctx.close()
}
await browser.close()
// Audit logs as admin
const ctx=await (await chromium.launch()).newContext()
const p=await ctx.newPage()
await login(p,'admin@csm.app')
await p.goto(BASE+'/audit-logs',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1000)
const auditBody=await p.textContent('body')
console.log(`Audit logs len=${auditBody.length} has data? ${auditBody.includes('Audit') || auditBody.includes('action') ? 'yes' : 'empty'}`)
await p.close()
await ctx.browser().close()
