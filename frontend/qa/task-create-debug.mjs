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
let lastPost=null
p.on('response', async r=>{
  if(r.url().includes('/api/v1/tasks') && r.request().method()==='POST'){
    const txt=await r.text().catch(()=> '')
    console.log('POST /tasks', r.status(), txt.slice(0,600))
    lastPost={status:r.status(), body:txt}
  }
})
await login(p,'taskmanager@csm.app')
await p.goto(BASE+'/tasks/new',{waitUntil:'networkidle'})
await p.waitForTimeout(1500)
console.log('CreateTaskPage loaded input count', await p.locator('input[placeholder="e.g. Write Instagram campaign copy"]').count())
console.log('first select options', await p.locator('select').first().evaluate(el=> Array.from(el.options).map(o=>({v:o.value,t:o.text})).slice(0,5)))
let title='TestTask-'+Date.now().toString().slice(-4)
await p.fill('input[placeholder="e.g. Write Instagram campaign copy"]', title)
const sel= p.locator('select').first()
const opts=await sel.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
console.log('project opts', opts.length, opts[0]?.slice(-6))
if(opts.length) await sel.selectOption(opts[0])
await p.fill('textarea[placeholder="What needs to be produced?"]','desc test')
const btn= p.locator('button').filter({hasText: 'Create & Assign'}).first()
console.log('btn found', await btn.count())
await btn.click()
await p.waitForTimeout(3000)
console.log('after submit body snippet', (await p.textContent('body')).slice(0,700).replace(/\n/g,' '))
console.log('lastPost', lastPost)
await b.close()
