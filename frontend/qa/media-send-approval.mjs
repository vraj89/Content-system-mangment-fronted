import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import os from 'os'

const BASE='http://localhost:3000'
const PASS='Password123!'

async function login(page,email){
  await page.goto(BASE+'/login',{waitUntil:'domcontentloaded'})
  await page.fill('input[type="email"]',email)
  await page.fill('input[type="password"]',PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard',{timeout:25000})
  await page.waitForTimeout(800)
}

const browser=await chromium.launch()
let ctx, page

// Ensure a MEDIA task exists for a project
console.log('=== PREP: ensure MEDIA task ===')
ctx=await browser.newContext()
page=await ctx.newPage()
await login(page,'taskmanager@csm.app')
let projId=await page.evaluate(async()=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/projects?limit=100',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  let d=j.data
  if(!d && j.projects) d=j.projects
  if(Array.isArray(d) && d.length) return d[0]._id
  if(d && d.projects && d.projects.length) return d.projects[0]._id
  return null
})
console.log('proj',projId)
let taskId=await page.evaluate(async(proj)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/tasks?assignedTeam=MEDIA_TEAM&projectId='+proj+'&limit=10',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  const d=j.data||[]
  if(d.length) return d[0]._id
  return null
},projId)
console.log('task',taskId)
if(!taskId){
  console.log('creating task')
  let res=await page.evaluate(async(proj)=>{
    const t=localStorage.getItem('csm.accessToken')
    const ru=await fetch('/api/v1/users?limit=100',{headers:{Authorization:`Bearer ${t}`}})
    const ju=await ru.json()
    const users=ju.data||[]
    let mu=null
    for(let u of users) if(u.role==='MEDIA_TEAM'){mu=u;break}
    const r=await fetch('/api/v1/tasks',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({title:'MediaTask-'+Date.now().toString().slice(-5), projectId:proj, taskType:'MEDIA', priority:'MEDIUM', status:'TODO', assignedTeam:'MEDIA_TEAM', assignedTo: mu?mu._id:undefined})})
    const txt=await r.text()
    return {status:r.status, txt:txt.slice(0,300)}
  },{proj:projId})
  console.log('create',res)
  taskId=await page.evaluate(async(proj)=>{
    const t=localStorage.getItem('csm.accessToken')
    const r=await fetch('/api/v1/tasks?assignedTeam=MEDIA_TEAM&projectId='+proj+'&limit=10',{headers:{Authorization:`Bearer ${t}`}})
    const j=await r.json()
    const d=j.data||[]
    return d[0]._id
  },projId)
  console.log('new task',taskId)
}
await ctx.close()

console.log('\n=== TEST MEDIA UPLOAD WITH SEND FOR APPROVAL ===')
ctx=await browser.newContext()
page=await ctx.newPage()
await login(page,'media@csm.app')
await page.goto(BASE+'/media',{waitUntil:'networkidle'})
await page.waitForTimeout(1500)
console.log('Media page loaded')
console.log('Project select', await page.locator('[data-testid="media-project-select"]').count())
console.log('Task select', await page.locator('[data-testid="media-task-select"]').count())
// Find a project that has MEDIA tasks
let projOptions=await page.locator('[data-testid="media-project-select"]').evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
let chosenProj=null, chosenTask=null
for(let po of projOptions){
  await page.locator('[data-testid="media-project-select"]').selectOption(po)
  await page.waitForTimeout(600)
  let tOpts=await page.locator('[data-testid="media-task-select"]').evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
  if(tOpts.length>0){ chosenProj=po; chosenTask=tOpts[0]; console.log('chosen',po.slice(-6), tOpts[0].slice(-6), tOpts.length); break }
}
if(!chosenProj){ console.log('FAIL no project with tasks'); await browser.close(); process.exit(1)}
await page.locator('[data-testid="media-task-select"]').selectOption(chosenTask)
await page.waitForTimeout(300)
// Check no pending file yet -> Send buttons not visible
console.log('Send button before attach', await page.locator('[data-testid="media-send-approval"]').count())
let tmpFile=path.join(os.tmpdir(), `test-media-${Date.now()}.png`)
const pngBase64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
fs.writeFileSync(tmpFile, Buffer.from(pngBase64,'base64'))
// Attach via file input (handleFileSelect)
let fileInput=page.locator('input[type="file"]')
await fileInput.setInputFiles(tmpFile)
await page.waitForTimeout(800)
console.log('After attach, pending attach visible', await page.locator('[data-testid="media-pending-attach"]').count())
console.log('Send for Approval button', await page.locator('[data-testid="media-send-approval"]').count())
console.log('Submit button', await page.locator('[data-testid="media-submit"]').count())
let body=await page.textContent('body')
console.log('Has file name?', body.includes('test-media')?'YES':'NO')
console.log('Has Send for Approval?', body.includes('Send for Approval')?'YES':'NO')
console.log('Has Submit?', body.includes('Submit')?'YES':'NO')

// Click Send for Approval
let sendBtn=page.locator('[data-testid="media-send-approval"]')
await sendBtn.click()
await page.waitForTimeout(2500)
body=await page.textContent('body')
console.log('After Send for Approval, has Sent for approval toast?', body.includes('Sent for approval')?'YES':'NO')
console.log('Has Task Manager will review?', body.includes('Task Manager')?'YES':'NO')
// Verify via API media created with project and task
let mediaList=await page.evaluate(async(proj)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/media?limit=50&projectId='+proj,{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  return j.data||[]
}, chosenProj)
console.log('Media list for project', mediaList.length)
let newMedia=mediaList.find(m=> String(m.taskId)===chosenTask && new Date(m.createdAt).getTime()>Date.now()-120000)
if(!newMedia) newMedia=mediaList[0]
console.log('newMedia project/task/status', newMedia? `${String(newMedia.projectId).slice(-6)} ${String(newMedia.taskId).slice(-6)} ${newMedia.status}`:'none')
console.log('Has correct projectId?', newMedia && String(newMedia.projectId)===chosenProj ? 'YES':'NO')
console.log('Has correct taskId?', newMedia && String(newMedia.taskId)===chosenTask ? 'YES':'NO')
// Check task status was moved to IN_REVIEW (goes to task manager)
let taskStatus=await page.evaluate(async(tid)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/tasks/'+tid,{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  return j.data ? j.data.status : null
}, chosenTask)
console.log('Linked task status after Send for Approval (should be IN_REVIEW):', taskStatus, taskStatus==='IN_REVIEW'?'PASS':'FAIL')

// Verify visible to task manager
let ctx2=await browser.newContext()
let p2=await ctx2.newPage()
await login(p2,'taskmanager@csm.app')
let taskForTM=await p2.evaluate(async(tid)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/tasks/'+tid,{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  return j.data
}, chosenTask)
console.log('Task Manager can see task?', taskForTM ? 'YES status='+taskForTM.status : 'NO')
let approvals=await p2.evaluate(async(proj)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/approvals?projectId='+proj+'&limit=20',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  return j.data||[]
}, chosenProj)
console.log('Approvals for project visible to TM:', approvals.length, approvals.map(a=>a.entityType+':'+a.status).join(', '))
await ctx2.close()

// Check persistence after reload
await page.reload({waitUntil:'networkidle'})
await page.waitForTimeout(1200)
let afterReload=await page.evaluate(async(proj)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/media?limit=50&projectId='+proj,{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json()
  return j.data||[]
}, chosenProj)
console.log('After reload media count same?', afterReload.length===mediaList.length?'PASS':'FAIL')

try{ fs.unlinkSync(tmpFile)}catch{}
await ctx.close()
await browser.close()
console.log('DONE')
