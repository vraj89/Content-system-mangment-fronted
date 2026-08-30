import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
async function login(p,e){ await p.goto(BASE+'/login',{waitUntil:'domcontentloaded'}); await p.fill('input[type="email"]',e); await p.fill('input[type="password"]',PASS); await p.click('button[type="submit"]'); await p.waitForURL('**/dashboard',{timeout:15000}); await p.waitForTimeout(1500)}
const browser=await chromium.launch()
for(const {role,email} of [
  {role:'ADMIN',email:'admin@csm.app'},
  {role:'MARKETING',email:'marketing@csm.app'},
  {role:'TASK_MANAGEMENT',email:'taskmanager@csm.app'},
  {role:'CONTENT_TEAM',email:'content@csm.app'},
  {role:'MEDIA_TEAM',email:'media@csm.app'},
  {role:'CLIENT',email:'client@csm.app'},
]){
  const ctx=await browser.newContext()
  const page=await ctx.newPage()
  await login(page,email)
  const data=await page.evaluate(async ()=>{
    const token=localStorage.getItem('csm.accessToken')
    const r=await fetch('/api/v1/dashboard',{headers:{Authorization:`Bearer ${token}`}})
    const j=await r.json(); return j.data
  })
  console.log(`${role} dashboard keys: ${Object.keys(data||{}).join(', ')} values: ${JSON.stringify(data).slice(0,300)}`)
  const body=await page.textContent('body')
  // Check dashboard cards are rendered and clickable
  const cards=await page.evaluate(()=>{
    return Array.from(document.querySelectorAll('button, a')).filter(el=>el.textContent && el.textContent.match(/Total|Pending|Active|Ready|Assigned|Drafts/)).length
  })
  console.log(`  cards/buttons with stats count ~${cards}`)
  await ctx.close()
}
await browser.close()
