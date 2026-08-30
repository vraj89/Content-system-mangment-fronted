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
    console.log('POST /tasks', r.status(), txt.slice(0,600))
    posts.push(r.status())
  }
})
await login(p,'taskmanager@csm.app')
await p.goto(BASE+'/tasks/new',{waitUntil:'networkidle'})
await p.waitForTimeout(1200)
console.log('CreateTaskPage loaded')
let title='PageWithDates-'+Date.now().toString().slice(-4)
await p.fill('input[placeholder="e.g. Write Instagram campaign copy"]', title)
let sel= p.locator('select').first()
let opts=await sel.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
console.log('project opts', opts.length)
if(opts.length) await sel.selectOption(opts[0])
// Fill dates
await p.fill('input[type="date"]', '2026-09-15')
let dateInputs=await p.locator('input[type="date"]').count()
console.log('date inputs', dateInputs)
// The page has startDate and dueDate, need to fill both
let inputs= p.locator('input[type="date"]')
await inputs.nth(0).fill('2026-09-01')
await inputs.nth(1).fill('2026-09-10')
let btn= p.locator('button').filter({hasText: 'Create & Assign'}).first()
console.log('btn', await btn.count())
await btn.click()
await p.waitForTimeout(2500)
console.log('posts', posts)
console.log('after body', (await p.textContent('body')).slice(0,400))
await b.close()
