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
console.log('TasksPage loaded, Create button', await p.locator('button:has-text("Create Task")').count())
// Click Create Task (the board header, not sidebar)
let headerBtn = p.locator('main').locator('button:has-text("Create Task")').first()
console.log('headerBtn count', await headerBtn.count())
await headerBtn.click()
await p.waitForTimeout(800)
console.log('Modal open?', await p.locator('text=Create Task').count(), await p.locator('text=Create and assign').count())
// Fill modal
await p.fill('input[name="title"]','ModalTest-'+Date.now().toString().slice(-4))
let projSel = p.locator('select[name="projectId"]')
let projOpts = await projSel.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
console.log('modal project opts', projOpts.length)
if(projOpts.length) await projSel.selectOption(projOpts[0])
// Select team
let teamSel = p.locator('select[name="assignedTeam"]')
await teamSel.selectOption('CONTENT_TEAM')
await p.waitForTimeout(500)
let assigneeSel = p.locator('select[name="assignedTo"]')
let assOpts = await assigneeSel.evaluate(el=> Array.from(el.options).map(o=>({v:o.value,t:o.text})).slice(0,3))
console.log('assignee opts after team', assOpts)
if(assOpts.length>1) await assigneeSel.selectOption(assOpts[1].v)
// Try without dates first
let submit = p.locator('button[type="submit"]:has-text("Create")').first()
console.log('submit count', await submit.count())
await submit.click()
await p.waitForTimeout(2500)
console.log('after submit without dates body snippet', (await p.textContent('body')).slice(0,500).replace(/\n/g,' '))
console.log('posts so far', posts.map(x=>x.status))

// Now try with dates
await headerBtn.click()
await p.waitForTimeout(800)
await p.fill('input[name="title"]','ModalWithDates-'+Date.now().toString().slice(-4))
projSel = p.locator('select[name="projectId"]')
projOpts = await projSel.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
if(projOpts.length) await projSel.selectOption(projOpts[0])
teamSel = p.locator('select[name="assignedTeam"]')
await teamSel.selectOption('MEDIA_TEAM')
await p.waitForTimeout(300)
assigneeSel = p.locator('select[name="assignedTo"]')
assOpts = await assigneeSel.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
if(assOpts.length) await assigneeSel.selectOption(assOpts[0])
// Fill dates
await p.fill('input[name="startDate"]','2026-09-01')
await p.fill('input[name="dueDate"]','2026-09-10')
await p.fill('input[name="estimatedHours"]','5')
submit = p.locator('button[type="submit"]:has-text("Create")').first()
await submit.click()
await p.waitForTimeout(2500)
console.log('after submit WITH dates body snippet', (await p.textContent('body')).slice(0,700).replace(/\n/g,' '))
console.log('posts after dates', posts.slice(-1))

await b.close()
