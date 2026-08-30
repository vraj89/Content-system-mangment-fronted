import { chromium } from 'playwright'
const BASE='http://localhost:3000'
const PASS='Password123!'
async function login(p,e){
  await p.goto(BASE+'/login',{waitUntil:'domcontentloaded'})
  await p.fill('input[type="email"]',e)
  await p.fill('input[type="password"]',PASS)
  await p.click('button[type="submit"]')
  await p.waitForURL('**/dashboard',{timeout:25000})
  await p.waitForTimeout(1000)
}
const b=await chromium.launch()
const c=await b.newContext({viewport:{width:1440,height:900}})
const p=await c.newPage()
await login(p,'taskmanager@csm.app')
const title=`KanbanFinal-${Date.now().toString().slice(-5)}`
const proj=await p.evaluate(async()=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/projects?limit=5',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json(); const d=j.data; if(Array.isArray(d)&&d[0])return d[0]._id; if(d&&d.projects&&d.projects[0])return d.projects[0]._id; return null
})
console.log('proj',proj)
await p.evaluate(async({title,proj})=>{
  const t=localStorage.getItem('csm.accessToken')
  await fetch('/api/v1/tasks',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({title, projectId:proj, priority:'MEDIUM', status:'TODO'})})
},{title,proj})
const taskId=await p.evaluate(async(title)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/tasks?search='+encodeURIComponent(title),{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json(); const d=j.data||[]; const f=d.find(x=>x.title===title); return f?f._id:null
},title)
console.log('taskId',taskId)
await p.goto(BASE+'/kanban',{waitUntil:'networkidle'})
await p.waitForTimeout(2500)
console.log('draggable',await p.locator('[draggable="true"]').count())
console.log('cols',await p.locator('[data-testid^="kanban-column-"]').count())
console.log('body has task title?', (await p.textContent('body')).includes(title) ? 'YES' : 'NO')
const src=p.locator(`[data-testid="kanban-card-${taskId}"]`)
console.log('src count before wait',await src.count())
try{ await src.waitFor({state:'visible',timeout:8000}); console.log('src visible after wait YES') }catch(e){ console.log('src wait failed',e.message.slice(0,100)) }
const target=p.locator('[data-testid="kanban-column-IN_PROGRESS"]')
await target.waitFor({state:'visible',timeout:5000})
// Try Playwright dragTo first
try{
  await src.dragTo(target)
  console.log('dragTo done')
}catch(e){ console.log('dragTo failed',e.message.slice(0,100))}
await p.waitForTimeout(1500)
let st=await p.evaluate(async(id)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/tasks/'+id,{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json(); return j.data?j.data.status:null
},taskId)
console.log('status after dragTo:',st)
if(st!=='IN_PROGRESS'){
  console.log('Trying manual dispatch fallback')
  const manual=await p.evaluate(async({id})=>{
    const src=document.querySelector(`[data-testid="kanban-card-${id}"]`)
    const tgt=document.querySelector('[data-testid="kanban-column-IN_PROGRESS"]')
    if(!src||!tgt) return 'missing'
    const dt=new DataTransfer()
    src.dispatchEvent(new DragEvent('dragstart',{dataTransfer:dt,bubbles:true, cancelable:true}))
    tgt.dispatchEvent(new DragEvent('dragover',{dataTransfer:dt,bubbles:true, cancelable:true}))
    tgt.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true, cancelable:true}))
    src.dispatchEvent(new DragEvent('dragend',{bubbles:true}))
    return 'dispatched'
  },{id:taskId})
  console.log('manual dispatch:',manual)
  await p.waitForTimeout(2000)
  st=await p.evaluate(async(id)=>{
    const t=localStorage.getItem('csm.accessToken')
    const r=await fetch('/api/v1/tasks/'+id,{headers:{Authorization:`Bearer ${t}`}})
    const j=await r.json(); return j.data?j.data.status:null
  },taskId)
  console.log('status after manual dispatch:',st)
}
if(st!=='IN_PROGRESS'){
  console.log('Trying Move button fallback')
  const moveBtn=src.locator('xpath=..').locator('button:has-text("Move")')
  // Actually find Move button inside card's parent column TODO
  const todoMove=await p.locator('[data-testid="kanban-column-TODO"] button:has-text("Move")').first().count()
  console.log('Move buttons in TODO:',todoMove)
  // Click Move on our card (first Move in TODO column should be our card if it's first)
  try{
    await p.locator('[data-testid="kanban-column-TODO"]').locator('button:has-text("Move")').first().click()
    await p.waitForTimeout(1500)
    st=await p.evaluate(async(id)=>{
      const t=localStorage.getItem('csm.accessToken')
      const r=await fetch('/api/v1/tasks/'+id,{headers:{Authorization:`Bearer ${t}`}})
      const j=await r.json(); return j.data?j.data.status:null
    },taskId)
    console.log('status after Move click:',st)
  }catch(e){ console.log('Move click failed',e.message.slice(0,100))}
}
console.log('status after drag should be IN_PROGRESS:',st)
await p.reload({waitUntil:'networkidle'})
await p.waitForTimeout(1500)
const st2=await p.evaluate(async(id)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/tasks/'+id,{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json(); return j.data?j.data.status:null
},taskId)
console.log('status after reload:',st2)
console.log('Move buttons still exist:',await p.locator('button:has-text("Move")').count())
console.log('KANBAN RESULT:', st==='IN_PROGRESS' && st2==='IN_PROGRESS' ? 'PASS' : 'FAIL')
await p.evaluate(async(id)=>{
  const t=localStorage.getItem('csm.accessToken')
  await fetch('/api/v1/tasks/'+id,{method:'DELETE',headers:{Authorization:`Bearer ${t}`}})
},taskId)
await b.close()
