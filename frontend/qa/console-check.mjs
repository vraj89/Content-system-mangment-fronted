import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
const roles=[
  {role:'ADMIN',email:'admin@csm.app'},
  {role:'MARKETING',email:'marketing@csm.app'},
  {role:'TASK_MANAGEMENT',email:'taskmanager@csm.app'},
  {role:'CONTENT_TEAM',email:'content@csm.app'},
  {role:'MEDIA_TEAM',email:'media@csm.app'},
  {role:'CLIENT',email:'client@csm.app'},
]
const browser=await chromium.launch()
for(const {role,email} of roles){
  const ctx=await browser.newContext()
  const page=await ctx.newPage()
  const consoleErrs=[]
  const failed=[]
  page.on('console',m=>{ if(m.type()==='error') consoleErrs.push(m.text().slice(0,150)) })
  page.on('response',r=>{ if(r.url().includes('/api') && r.status()>=400) failed.push(`${r.request().method()} ${r.url().split('/api')[1].slice(0,60)} -> ${r.status()}`)})
  await page.goto(BASE+'/login',{waitUntil:'domcontentloaded'})
  await page.fill('input[type="email"]',email)
  await page.fill('input[type="password"]',PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard',{timeout:15000})
  await page.waitForTimeout(2000)
  // navigate dashboard, projects, content etc depending on role
  const paths={
    ADMIN:['/dashboard','/projects','/clients','/approvals','/ready-to-publish','/payments'],
    MARKETING:['/dashboard','/clients','/projects','/pipeline'],
    TASK_MANAGEMENT:['/dashboard','/tasks','/kanban','/team-workload'],
    CONTENT_TEAM:['/dashboard','/content','/tasks'],
    MEDIA_TEAM:['/dashboard','/media','/tasks'],
    CLIENT:['/dashboard','/projects','/content','/approvals','/payments'],
  }
  for(const p of (paths[role]||['/dashboard'])){
    await page.goto(BASE+p,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(800)
  }
  console.log(`${role}: consoleErrors=${consoleErrs.length} failedAPI=${failed.length}`)
  if(consoleErrs.length) console.log('  console:',consoleErrs.slice(0,3).join(' | '))
  if(failed.length) console.log('  failed:',failed.slice(0,5).join(' | '))
  await ctx.close()
}
await browser.close()
