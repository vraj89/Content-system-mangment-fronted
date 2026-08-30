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
  const errs=[]
  page.on('console',m=>{if(m.type()==='error') errs.push(m.text().slice(0,120))})
  page.on('response',r=>{if(r.status()>=400 && r.url().includes('/api')) errs.push(r.request().method()+' '+r.url().split('/api')[1].slice(0,80)+' -> '+r.status())})
  try{
    await page.goto(BASE+'/login',{waitUntil:'networkidle'})
    await page.fill('input[type="email"]',email)
    await page.fill('input[type="password"]',PASS)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard',{timeout:20000})
    await page.waitForTimeout(2500)
    const body=await page.textContent('body')
    const dashOk=body.includes('Dashboard')
    console.log(role+': login '+(dashOk?'OK':'FAIL')+' len='+body.length)
    if(errs.length) console.log('  api errs:', errs.slice(0,5).join(' | '))
    const sample=await page.evaluate(()=>document.body.innerText.slice(0,200).replace(/\n/g,' '))
    console.log('  sample:', sample.slice(0,120))
  }catch(e){ console.log(role+': FAIL '+e.message.slice(0,300)) }
  await ctx.close()
}
await browser.close()
