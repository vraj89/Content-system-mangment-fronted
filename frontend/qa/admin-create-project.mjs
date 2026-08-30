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
await p.waitForTimeout(1200)
console.log('Projects page loaded')
let newBtn=await p.locator('button:has-text("New Project")').count()
console.log('New Project button count:', newBtn)
await p.click('button:has-text("New Project")')
await p.waitForTimeout(800)
let hasClientSelect = await p.locator('[data-testid="project-client-select"]').count()
console.log('Client select in modal:', hasClientSelect)
let body=await p.textContent('body')
console.log('Modal has Client *:', body.includes('Client')?'YES':'NO')
let projSelect= p.locator('[data-testid="project-client-select"]')
let opts=await projSelect.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
console.log('Client options:', opts.length)
if(opts.length>0){
  await projSelect.selectOption(opts[0])
  console.log('Selected client:', opts[0].slice(-6))
}
let projName=`AdminProj-${Date.now().toString().slice(-5)}`
await p.fill('input[name="name"]', projName)
await p.fill('textarea[name="description"]','Test project from admin via fixed flow')
let submit=p.locator('[data-testid="project-create-submit"]')
await submit.click()
await p.waitForTimeout(2500)
body=await p.textContent('body')
console.log('After submit, has Project created toast or detail:', body.includes('Project created') || body.includes(projName) ? 'YES' : 'NO')
console.log('URL after create:', p.url())
let isDetail = p.url().includes('/projects/')
console.log('Navigated to detail?', isDetail?'YES':'NO')
if(isDetail){
  let detailBody=await p.textContent('body')
  console.log('Detail shows project name?', detailBody.includes(projName)?'YES':'NO')
}
let afterList=await p.evaluate(async()=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/projects?search=AdminProj&limit=10',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  const d=j.data||[]
  return d.length
})
console.log('API list has new project (via search):', afterReload=> afterReload, afterList)

// Test validation: try to create without client
await p.goto(BASE+'/projects',{waitUntil:'networkidle'})
await p.waitForTimeout(800)
await p.click('button:has-text("New Project")')
await p.waitForTimeout(600)
await p.fill('input[name="name"]','NoClientProj')
await p.locator('[data-testid="project-create-submit"]').click()
await p.waitForTimeout(800)
body=await p.textContent('body')
console.log('Without client -> shows Client required error?:', body.includes('Client required')?'YES':'NO')
await c.close()
await b.close()
console.log('ADMIN CREATE PROJECT TEST DONE')
