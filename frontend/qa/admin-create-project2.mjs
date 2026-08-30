import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
async function login(p,e){
  await p.goto(BASE+'/login',{waitUntil:'domcontentloaded'})
  await p.fill('input[type="email"]',e)
  await p.fill('input[type="password"]',PASS)
  await p.click('button[type="submit"]')
  await p.waitForURL('**/dashboard',{timeout:25000})
  await p.waitForTimeout(800)
}
const b=await chromium.launch()
let c=await b.newContext()
let p=await c.newPage()
await login(p,'admin@csm.app')
await p.goto(BASE+'/projects',{waitUntil:'networkidle'})
await p.waitForTimeout(800)
await p.click('button:has-text("New Project")')
await p.waitForTimeout(600)
// Test without client - should NOT create
let beforeCount=await p.evaluate(async()=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/projects?limit=100',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  return (j.data||[]).length
})
console.log('Before count:', beforeCount)
await p.fill('input[name="name"]','NoClientProj-'+Date.now().toString().slice(-4))
await p.locator('[data-testid="project-create-submit"]').click()
await p.waitForTimeout(1000)
let afterCount=await p.evaluate(async()=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/projects?limit=100',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  return (j.data||[]).length
})
console.log('After count without client (should equal before):', afterCount, afterCount===beforeCount?'PASS':'FAIL')
let modalStillOpen = await p.locator('[data-testid="project-client-select"]').count()
console.log('Modal still open after invalid submit (required validation):', modalStillOpen?'YES PASS':'NO')
let body=await p.textContent('body')
console.log('Body has modal title New Project?:', body.includes('New Project')?'YES':'NO')
await p.locator('button:has-text("Cancel")').click()
await p.waitForTimeout(500)

// Now test with client and verify project detail shows name
await p.click('button:has-text("New Project")')
await p.waitForTimeout(600)
let sel= p.locator('[data-testid="project-client-select"]')
let opts=await sel.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
await sel.selectOption(opts[0])
let projName=`AdminProj2-${Date.now().toString().slice(-5)}`
await p.fill('input[name="name"]', projName)
await p.locator('[data-testid="project-create-submit"]').click()
await p.waitForTimeout(2500)
console.log('URL after valid create:', p.url())
await p.waitForTimeout(1000)
let detailBody=await p.textContent('body')
console.log('Detail shows name?', detailBody.includes(projName)?'YES PASS':'NO (checking API)')
let apiProj=await p.evaluate(async(name)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/projects?search='+encodeURIComponent(name)+'&limit=5',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  return j.data||[]
}, projName)
console.log('API found project:', apiProj.length?'YES':'NO', apiProj[0]?.name, 'clientId:', apiProj[0]?.clientId ? String(apiProj[0].clientId).slice(-6) : 'none')
console.log('API project has clientId?', apiProj[0]?.clientId ? 'YES PASS' : 'NO FAIL')
await c.close()
await b.close()
