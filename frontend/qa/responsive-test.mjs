import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
async function login(p,email){ await p.goto(BASE+'/login',{waitUntil:'domcontentloaded'}); await p.fill('input[type="email"]',email); await p.fill('input[type="password"]',PASS); await p.click('button[type="submit"]'); await p.waitForURL('**/dashboard',{timeout:15000}); await p.waitForTimeout(1000)}
const browser=await chromium.launch()
for(const {w,h,label} of [{w:375,h:667,label:'Mobile'},{w:768,h:1024,label:'Tablet'},{w:1440,h:900,label:'Desktop'}]){
  const ctx=await browser.newContext({viewport:{width:w,height:h}})
  const page=await ctx.newPage()
  await login(page,'admin@csm.app')
  await page.goto(BASE+'/dashboard',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(800)
  const hasHScroll=await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth)
  const sidebarVisible=await page.evaluate(()=>{ const a=document.querySelector('aside'); return a? window.getComputedStyle(a).display!=='none' : false})
  const mainW=await page.evaluate(()=>document.querySelector('main')?.getBoundingClientRect().width||0)
  const overflow=await page.evaluate(()=>{ const el=document.querySelector('main'); return el ? el.scrollWidth > el.clientWidth : false})
  console.log(`${label} ${w}x${h}: hasHScroll=${hasHScroll} sidebarVisible=${sidebarVisible} mainW=${Math.round(mainW)} overflow=${overflow}`)
  // Check dashboard cards visible
  const cards=await page.locator('[class*="StatCard"], [class*="stat"]').count().catch(()=>0)
  // Check forms not broken
  await page.goto(BASE+'/clients/new',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(800)
  const formOverflow=await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth)
  console.log(`  clients/new formOverflow=${formOverflow}`)
  await ctx.close()
}
await browser.close()
// Test Kanban responsive
const ctx2=await (await chromium.launch()).newContext({viewport:{width:375,height:667}})
const p2=await ctx2.newPage()
await login(p2,'taskmanager@csm.app')
await p2.goto(BASE+'/kanban',{waitUntil:'domcontentloaded'}); await p2.waitForTimeout(800)
const kanbanOverflow=await p2.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth)
console.log(`Kanban Mobile overflow? ${kanbanOverflow}`)
await p2.close()
await ctx2.browser().close()
