import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
async function login(p,e){
  await p.goto(BASE+'/login',{waitUntil:'domcontentloaded'})
  await p.fill('input[type="email"]',e)
  await p.fill('input[type="password"]',PASS)
  await p.click('button[type="submit"]')
  await p.waitForURL('**/dashboard',{timeout:25000})
  await p.waitForTimeout(1200)
}
const b=await chromium.launch()
const c=await b.newContext()
const p=await c.newPage()
await login(p,'media@csm.app')
await p.goto(BASE+'/media',{waitUntil:'domcontentloaded'})
await p.waitForTimeout(2000)
console.log('options after 2s:', await p.locator('[data-testid="media-project-select"] option').count())
console.log('project select html:', (await p.locator('[data-testid="media-project-select"]').innerHTML()).slice(0,400))
const apiCount=await p.evaluate(async()=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/projects?limit=100',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  return (j.data||[]).length
})
console.log('api projects count for media user:', apiCount)
await b.close()
