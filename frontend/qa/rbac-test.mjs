import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
const tests=[
  {role:'ADMIN',email:'admin@csm.app', shouldAccess:['/dashboard','/users','/audit-logs','/ready-to-publish','/projects','/clients','/tasks','/approvals','/payments'], shouldBlock:[]},
  {role:'MARKETING',email:'marketing@csm.app', shouldAccess:['/dashboard','/leads','/clients','/clients/new','/pipeline'], shouldBlock:['/users','/audit-logs','/ready-to-publish']},
  {role:'TASK_MANAGEMENT',email:'taskmanager@csm.app', shouldAccess:['/dashboard','/tasks','/kanban','/team-workload'], shouldBlock:['/users','/ready-to-publish','/audit-logs','/clients/new']},
  {role:'CONTENT_TEAM',email:'content@csm.app', shouldAccess:['/dashboard','/content','/tasks'], shouldBlock:['/users','/clients','/clients/new','/ready-to-publish','/audit-logs','/payments']},
  {role:'MEDIA_TEAM',email:'media@csm.app', shouldAccess:['/dashboard','/media','/tasks'], shouldBlock:['/users','/clients','/clients/new','/ready-to-publish','/audit-logs','/payments']},
  {role:'CLIENT',email:'client@csm.app', shouldAccess:['/dashboard','/projects','/content','/approvals','/payments'], shouldBlock:['/users','/tasks/new','/audit-logs','/ready-to-publish','/clients','/clients/new','/team-workload']},
]
async function login(page,email){
  await page.goto(`${BASE}/login`,{waitUntil:'networkidle'})
  await page.fill('input[type="email"]',email)
  await page.fill('input[type="password"]',PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard',{timeout:20000})
  await page.waitForTimeout(1000)
}
const browser=await chromium.launch()
let report=[]
for(const t of tests){
  const ctx=await browser.newContext()
  const page=await ctx.newPage()
  const res=[]
  try{
    await login(page,t.email)
    // check sidebar items
    const sidebar=await page.evaluate(()=>{
      const btns=Array.from(document.querySelectorAll('nav button')).map(b=>b.textContent.trim().replace(/\s+/g,' ').slice(0,30))
      return btns
    })
    report.push(`${t.role} sidebar: ${sidebar.join(' | ')}`)
    // check dashboard title
    const dashTitle=await page.textContent('body').then(b=>b.slice(0,500).includes('Dashboard')?'Dashboard OK':'Dashboard missing')
    report.push(`  ${dashTitle}`)
    for(const p of t.shouldAccess){
      await page.goto(`${BASE}${p}`,{waitUntil:'networkidle'}); await page.waitForTimeout(800)
      const body=await page.textContent('body')
      const hasError=body.includes("You don't have permission") || body.includes('403') || body.includes('Not authorized')
      const len=body.length
      report.push(`  ACCESS ${p}: ${hasError?'BLOCKED (unexpected)':'OK'} len=${len}`)
      if(hasError) res.push(`FAIL shouldAccess ${p} blocked`)
    }
    for(const p of t.shouldBlock){
      await page.goto(`${BASE}${p}`,{waitUntil:'networkidle'}); await page.waitForTimeout(800)
      const body=await page.textContent('body')
      const blocked=body.includes("You don't have permission") || body.includes('403') || body.includes('Permission') || body.includes('Dashboard') && !body.includes(p.split('/')[1]) // heuristic
      // Check PermissionRoute shows error card
      const isBlocked=body.includes("You don't have permission") || body.includes('Access denied') || body.includes('Not authorized')
      report.push(`  BLOCK ${p}: ${isBlocked?'correctly blocked':'UNBLOCKED (checking API 403)'} len=${body.length}`)
      // Also check network response via evaluate fetch
      const apiCheck=await page.evaluate(async (path)=>{
        const token=localStorage.getItem('csm.accessToken')
        const r=await fetch(`/api/v1${path}`,{headers:{Authorization:`Bearer ${token}`}})
        return r.status
      },p)
      if(apiCheck===403) report.push(`    API confirms 403 for ${p}`)
      else if(t.shouldBlock.includes(p) && apiCheck===200) report.push(`    WARN API allowed ${p} -> ${apiCheck}`)
    }
  }catch(e){
    report.push(`${t.role} ERROR ${e.message.slice(0,200)}`)
  }
  await ctx.close()
}
await browser.close()
console.log(report.join('\n'))
import fs from 'fs'
fs.writeFileSync('D:/Internship tasks/CSM/frontend/qa-out/rbac-report.txt', report.join('\n'))
