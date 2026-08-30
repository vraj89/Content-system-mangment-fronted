import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
async function login(p,e){
  await p.goto(BASE+'/login',{waitUntil:'domcontentloaded'})
  await p.fill('input[type="email"]',e)
  await p.fill('input[type="password"]',PASS)
  await p.click('button[type="submit"]')
  await p.waitForURL('**/dashboard',{timeout:25000})
}
const b=await chromium.launch()
const c=await b.newContext()
const p=await c.newPage()
let posts=[]
p.on('response', async r=>{
  if(r.url().includes('/api/v1/tasks') && r.request().method()==='POST'){
    const txt=await r.text().catch(()=> '')
    console.log('POST /tasks', r.status(), txt.slice(0,800))
    posts.push({status:r.status(), body:txt})
  }
})
await login(p,'taskmanager@csm.app')
await p.goto(BASE+'/tasks',{waitUntil:'networkidle'})
await p.waitForTimeout(1500)
console.log('TasksPage loaded')
let headerBtn = p.locator('main').locator('button:has-text("Create Task")').first()
await headerBtn.click()
await p.waitForTimeout(1000)
// Wait for projects to load
let projSel = p.locator('select[name="projectId"]')
for(let i=0;i<10;i++){
  let cnt=await projSel.evaluate(el=> Array.from(el.options).filter(o=>o.value).length)
  console.log('try',i,'project opts',cnt)
  if(cnt>0) break
  await p.waitForTimeout(800)
}
let projOpts = await projSel.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
console.log('final project opts', projOpts.length)
if(projOpts.length) await projSel.selectOption(projOpts[0])

await p.fill('input[name="title"]','ModalTest2-'+Date.now().toString().slice(-4))
let teamSel = p.locator('select[name="assignedTeam"]')
await teamSel.selectOption('CONTENT_TEAM')
await p.waitForTimeout(500)
let assigneeSel = p.locator('select[name="assignedTo"]')
let assCnt = await assigneeSel.evaluate(el=> Array.from(el.options).filter(o=>o.value).length)
console.log('assignee opts', assCnt)
if(assCnt>0){
  let vals=await assigneeSel.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
  await assigneeSel.selectOption(vals[0])
}
// Test without dates first
let submit = p.locator('button[type="submit"]:has-text("Create")').first()
await submit.click()
await p.waitForTimeout(2500)
console.log('after submit without dates posts', posts.map(x=>x.status))
let body=await p.textContent('body')
console.log('modal still open?', body.includes('Create Task') && body.includes('Select project') ? 'YES (maybe failed)' : 'NO (closed, success)')

// If modal still open, close it and try with dates
if(await p.locator('text=Create Task').count() > 2){
  await p.locator('button:has-text("Cancel")').first().click()
  await p.waitForTimeout(500)
}

// Now test with dates
await headerBtn.click()
await p.waitForTimeout(1000)
projSel = p.locator('select[name="projectId"]')
projOpts = await projSel.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
if(projOpts.length) await projSel.selectOption(projOpts[0])
await p.fill('input[name="title"]','ModalWithDates-'+Date.now().toString().slice(-4))
teamSel = p.locator('select[name="assignedTeam"]')
await teamSel.selectOption('MEDIA_TEAM')
await p.waitForTimeout(300)
assigneeSel = p.locator('select[name="assignedTo"]')
let vals2=await assigneeSel.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
if(vals2.length) await assigneeSel.selectOption(vals2[0])
await p.fill('input[name="startDate"]','2026-09-01')
await p.fill('input[name="dueDate"]','2026-09-10')
await p.fill('input[name="estimatedHours"]','5')
posts=[]
submit = p.locator('button[type="submit"]:has-text("Create")').first()
await submit.click()
await p.waitForTimeout(2500)
console.log('after submit WITH dates posts', posts.map(x=>x.status + ':'+x.body.slice(0,200)))
body=await p.textContent('body')
console.log('after dates modal closed?', body.includes('Create Task') && await p.locator('select[name="projectId"]').count()>0 ? 'STILL OPEN' : 'CLOSED')

await b.close()
