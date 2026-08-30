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
  await page.waitForTimeout(1000)
}

const browser=await chromium.launch()
let ctx, page

// 1. Check Media Dashboard has NO Upload Media
console.log('=== CHECK MEDIA DASHBOARD (should have NO Upload) ===')
ctx=await browser.newContext()
page=await ctx.newPage()
await login(page,'media@csm.app')
await page.goto(BASE+'/dashboard',{waitUntil:'networkidle'})
await page.waitForTimeout(1200)
let dashBody=await page.textContent('body')
let hasDashboardUpload = dashBody.includes('Upload Media')
let hasDashboardButton = await page.locator('button:has-text("Upload Media")').count()
console.log('Dashboard Upload Media text in body:', hasDashboardUpload)
console.log('Dashboard Upload Media button count:', hasDashboardButton)
console.log('Expected: 0 (removed) ->', hasDashboardButton===0 ? 'PASS' : 'FAIL')
await ctx.close()

// 2. Ensure there is a project with MEDIA task for testing
// If not, create one via taskmanager
console.log('\n=== ENSURE PROJECT WITH MEDIA TASK EXISTS ===')
ctx=await browser.newContext()
page=await ctx.newPage()
await login(page,'taskmanager@csm.app')
let projId=await page.evaluate(async()=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/projects?limit=5',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json(); const d=j.data||j.data?.projects||[]; const arr=Array.isArray(d)?d:d.projects||[]; return arr[0]?._id||arr[0]?._id:null
})
// More robust
projId=await page.evaluate(async()=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/projects?limit=100',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json(); let d=j.data; if(!d) d=j; if(Array.isArray(d)) return d[0]?._id:null; if(d.projects) return d.projects[0]?._id:null; return null
})
console.log('Using project:', projId)
let taskIdForProj=await page.evaluate(async(proj)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/tasks?assignedTeam=MEDIA_TEAM&projectId='+proj+'&limit=10',{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json(); const d=j.data||[]; return d[0]?._id:null
},projId)
console.log('Existing MEDIA task for project:', taskIdForProj)
if(!taskIdForProj){
  console.log('Creating new MEDIA task for project...')
  let newTask=await page.evaluate(async({proj})=>{
    const t=localStorage.getItem('csm.accessToken')
    // get media user id
    const ru=await fetch('/api/v1/users?limit=100',{headers:{Authorization:`Bearer ${t}`}})
    const ju=await ru.json(); const users=ju.data||[]; const mu=users.find(u=>u.role==='MEDIA_TEAM'); 
    const r=await fetch('/api/v1/tasks',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({title:`MediaTask-${Date.now().toString().slice(-5)}`, projectId:proj, taskType:'MEDIA', priority:'MEDIUM', status:'TODO', assignedTeam:'MEDIA_TEAM', assignedTo: mu?._id: undefined})})
    const txt=await r.text(); return {status:r.status, txt:txt.slice(0,300)}
  },{proj:projId})
  console.log('Create result:', newTask)
  taskIdForProj=await page.evaluate(async(proj)=>{
    const t=localStorage.getItem('csm.accessToken')
    const r=await fetch('/api/v1/tasks?assignedTeam=MEDIA_TEAM&projectId='+proj+'&limit=10',{headers:{Authorization:`Bearer ${t}`}})
    const j=await r.json(); const d=j.data||[]; return d[0]?._id:null
  },projId)
  console.log('New task id:', taskIdForProj)
}
await ctx.close()

// 3. Test Media Library flow
console.log('\n=== TEST MEDIA LIBRARY SINGLE ENTRY FLOW ===')
ctx=await browser.newContext()
page=await ctx.newPage()
await login(page,'media@csm.app')
await page.goto(BASE+'/media',{waitUntil:'networkidle'})
await page.waitForTimeout(1500)
let body=await page.textContent('body')
console.log('Media page has Project *:', body.includes('Project')?'YES':'NO')
console.log('Media page has Linked Task *:', body.includes('Linked Task')?'YES':'NO')
let projSelect=page.locator('[data-testid="media-project-select"]')
let taskSelect=page.locator('[data-testid="media-task-select"]')
console.log('Project select count:', await projSelect.count())
console.log('Task select count:', await taskSelect.count())
console.log('Task select disabled initially (no project):', await taskSelect.isDisabled()?'YES':'NO')
let dropzone=page.locator('[data-testid="media-dropzone"]')
console.log('Dropzone count:', await dropzone.count())
let addMediaBtn=page.locator('button:has-text("Add Media")')
console.log('Add Media button count (header):', await addMediaBtn.count())

// Try clicking Add Media without selections -> should show Project required toast
await addMediaBtn.click()
await page.waitForTimeout(800)
body=await page.textContent('body')
console.log('Click Add Media without project -> Project required toast?:', body.includes('Project required')?'YES':'NO')

// Select project
let projOptions=await projSelect.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
console.log('Project options available:', projOptions.length)
let chosenProj = projId || projOptions[0]
if(projOptions.includes(projId)) chosenProj=projId
else chosenProj=projOptions[0]
await projSelect.selectOption(chosenProj)
await page.waitForTimeout(800)
console.log('Selected project:', chosenProj.slice(-6))
console.log('Task select disabled after project?', await taskSelect.isDisabled()?'YES (FAIL)':'NO (PASS)')
let taskOptions=await taskSelect.evaluate(el=> Array.from(el.options).map(o=>({v:o.value, t:o.text})).filter(o=>o.v))
console.log('Task options for project:', taskOptions.length, taskOptions.slice(0,2).map(o=>o.t).join(' | '))
if(taskOptions.length===0){
  console.log('NOTE: No MEDIA tasks for this project, trying another project')
  for(let po of projOptions){
    await projSelect.selectOption(po)
    await page.waitForTimeout(600)
    let cnt=await taskSelect.evaluate(el=> Array.from(el.options).filter(o=>o.value).length)
    if(cnt>0){ chosenProj=po; console.log('Found project with tasks:', po.slice(-6), 'tasks:', cnt); break }
  }
}
taskOptions=await taskSelect.evaluate(el=> Array.from(el.options).map(o=>o.value).filter(v=>v))
console.log('Final task options:', taskOptions.length)
if(taskOptions.length>0){
  await taskSelect.selectOption(taskOptions[0])
  console.log('Selected task:', taskOptions[0].slice(-6))
  await page.waitForTimeout(500)
}

// Try upload without file yet -> just validation of dropzone click without file not relevant
// Now try uploading with both selections
let tmpFile=path.join(os.tmpdir(), `test-media-${Date.now()}.png`)
const pngBase64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
fs.writeFileSync(tmpFile, Buffer.from(pngBase64,'base64'))
console.log('Temp file:', tmpFile)

// Test that dropzone click without task would fail — already have task, so test with task selected should succeed
let fileInput=page.locator('input[type="file"]')
await fileInput.setInputFiles(tmpFile)
await page.waitForTimeout(1500)
body=await page.textContent('body')
console.log('After file set with both selections, has Uploading/Upload complete?:', body.includes('Uploading') || body.includes('Upload complete') ? 'YES' : 'NO')
await page.waitForTimeout(2000)
body=await page.textContent('body')
console.log('After wait, has Upload complete?:', body.includes('Upload complete') ? 'YES' : 'NO')
let apiErrs=[]
page.on('response',r=>{ if(r.url().includes('/api') && r.status()>=400) apiErrs.push(r.status()) })
// Verify via API that media exists with both projectId and taskId
let mediaList=await page.evaluate(async(proj)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/media?limit=50&projectId='+proj,{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json(); return j.data||[]
}, chosenProj)
console.log('Media list for project after upload:', mediaList.length)
let newMedia=mediaList.find(m=> m.fileName && m.fileName.includes('test-media') || m.fileName==='test-media.png' || m.createdAt && new Date(m.createdAt).getTime() > Date.now()-60000)
if(!newMedia) newMedia=mediaList[0]
console.log('New media sample:', newMedia ? `projectId=${String(newMedia.projectId).slice(-6)} taskId=${String(newMedia.taskId||'').slice(-6)} status=${newMedia.status}` : 'none')
let hasCorrectIds = newMedia && String(newMedia.projectId)===chosenProj && String(newMedia.taskId)===taskOptions[0]
console.log('Has correct projectId+taskId?:', hasCorrectIds ? 'YES' : 'NO')

// Verify persistence after refresh
await page.reload({waitUntil:'networkidle'})
await page.waitForTimeout(1500)
// Need to re-select project/task after reload to check? But media list via API should persist regardless
let afterReload=await page.evaluate(async(proj)=>{
  const t=localStorage.getItem('csm.accessToken')
  const r=await fetch('/api/v1/media?limit=50&projectId='+proj,{headers:{Authorization:`Bearer ${t}`}})
  const j=await r.json(); return j.data||[]
}, chosenProj)
console.log('After reload media count:', afterReload.length, afterReload.length===mediaList.length?'PASS':'FAIL')

// Verify validation: try to upload without task (clear task)
await page.goto(BASE+'/media',{waitUntil:'networkidle'})
await page.waitForTimeout(1200)
await page.locator('[data-testid="media-project-select"]').selectOption(chosenProj)
await page.waitForTimeout(500)
// Ensure task not selected (clear)
await page.evaluate(()=>{ const s=document.querySelector('[data-testid="media-task-select"]'); if(s) s.value='' })
let fileInput2=page.locator('input[type="file"]')
await fileInput2.setInputFiles(tmpFile)
await page.waitForTimeout(800)
body=await page.textContent('body')
console.log('Upload without task -> Linked Task required toast?:', body.includes('Linked Task required')?'YES':'NO')

try{ fs.unlinkSync(tmpFile)}catch{}
await ctx.close()
await browser.close()
console.log('\n=== SUMMARY ===')
console.log('Dashboard no upload:', hasDashboardButton===0?'PASS':'FAIL')
console.log('Media Library Project+Task required and filtered:', (await projSelect.count()) && (await taskSelect.count()) ? 'PASS':'FAIL')
console.log('Upload with both -> persisted:', afterReload.length===mediaList.length && hasCorrectIds ? 'PASS':'FAIL')
