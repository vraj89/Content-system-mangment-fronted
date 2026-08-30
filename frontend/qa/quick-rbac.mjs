import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
async function login(p,email){ await p.goto(BASE+'/login',{waitUntil:'domcontentloaded'}); await p.fill('input[type="email"]',email); await p.fill('input[type="password"]',PASS); await p.click('button[type="submit"]'); await p.waitForURL('**/dashboard',{timeout:15000}); await p.waitForTimeout(1000)}
const browser=await chromium.launch()
for(const {role,email,block} of [
  {role:'CLIENT',email:'client@csm.app',block:'/users'},
  {role:'CLIENT',email:'client@csm.app',block:'/audit-logs'},
  {role:'CONTENT_TEAM',email:'content@csm.app',block:'/users'},
  {role:'MEDIA_TEAM',email:'media@csm.app',block:'/clients/new'},
  {role:'MARKETING',email:'marketing@csm.app',block:'/users'},
  {role:'TASK_MANAGEMENT',email:'taskmanager@csm.app',block:'/ready-to-publish'},
]){
  const ctx=await browser.newContext()
  const page=await ctx.newPage()
  await login(page,email)
  await page.goto(BASE+block,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(800)
  const body=await page.textContent('body')
  const blocked=body.includes("You don't have permission") || body.includes('403') || body.length<500
  console.log(`${role} -> ${block}: ${blocked?'BLOCKED':'UNBLOCKED'} len=${body.length} snippet=${body.slice(0,120).replace(/\n/g,' ')}`)
  await ctx.close()
}
await browser.close()
