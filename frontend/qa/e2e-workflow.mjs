import { chromium } from 'playwright'
import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
const __dirname=path.dirname(fileURLToPath(import.meta.url))
dotenv.config({path:path.resolve(__dirname,'../../backend/.env')})
const BASE='http://localhost:3000'
const PASS='Password123!'
const OUT='D:/Internship tasks/CSM/frontend/qa-out'
fs.mkdirSync(OUT,{recursive:true})
const uniq=Date.now().toString().slice(-6)

async function setClientPassword(email, pw=PASS){
  try{
    execSync(`node "${path.resolve(__dirname,'../../backend/set-client-pw.mjs')}" "${email}" "${pw}"`,{stdio:'pipe'})
    console.log(`setClientPassword: set for ${email}`)
    return true
  }catch(e){
    console.log('setClientPassword failed '+e.message)
    return false
  }
}
async function login(page,email){ await page.goto(`${BASE}/login`,{waitUntil:'networkidle'}); await page.fill('input[type="email"]',email); await page.fill('input[type="password"]',PASS); await page.click('button[type="submit"]'); await page.waitForURL('**/dashboard',{timeout:20000}); await page.waitForTimeout(1500) }

async function run(){
  const browser=await chromium.launch()
  let report=[]
  let errors=[]
  function log(s){ report.push(s); console.log(s) }

  // --- MARKETING: create client ---
  log('=== MARKETING create client ===')
  let ctx=await browser.newContext()
  let page=await ctx.newPage()
  page.on('response',r=>{ if(r.url().includes('/api') && r.status()>=400) errors.push(`MARKETING ${r.request().method()} ${r.url().split('/api')[1].slice(0,80)} -> ${r.status()}`)})
  await login(page,'marketing@csm.app')
  // Open onboarding modal via dashboard button
  let createdViaUI=false
  try{
    const onboardBtn=page.getByRole('button',{name:'Client Onboarding'})
    await onboardBtn.waitFor({state:'visible',timeout:5000})
    await onboardBtn.click(); await page.waitForTimeout(800)
    await page.fill('input[name="companyName"]',`E2E Corp ${uniq}`)
    await page.fill('input[name="clientName"]','E2E Client')
    await page.fill('input[name="email"]',`e2e${uniq}@testcorp.com`)
    await page.fill('input[name="phone"]','+15550001111')
    const prod=page.locator('textarea[name="productInformation"]')
    if(await prod.count()) await prod.fill('Test product info')
    const camp=page.locator('textarea[name="requirements"]').first()
    if(await camp.count()) await camp.fill('Test campaign')
    const campaignInfo=page.locator('textarea[name="campaignInformation"]')
    if(await campaignInfo.count()) await campaignInfo.fill('Media deliverables')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    log('Marketing: client create submitted via UI')
    createdViaUI=true
  }catch(e){
    log('Marketing: UI create failed '+e.message.slice(0,100)+', falling back to API')
    const apiRes=await page.evaluate(async (uniq)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch('/api/v1/clients',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({companyName:`E2E Corp ${uniq}`,clientName:'E2E Client',email:`e2e${uniq}@testcorp.com`,phone:'+15550001111',productInformation:'Test product info',campaignInformation:'Media deliverables',requirements:'Test campaign'})})
      return {status:r.status, text:await r.text()}
    },uniq)
    log(`Marketing: API create ${apiRes.status} ${apiRes.text.slice(0,250)}`)
  }
  // Verify client appears in list
  await page.goto(`${BASE}/clients`,{waitUntil:'networkidle'}); await page.waitForTimeout(1500)
  const bodyClients=await page.textContent('body')
  const foundClient=bodyClients.includes(`E2E Corp ${uniq}`) || bodyClients.includes(`e2e${uniq}`)
  log(`Marketing: client list contains new client? ${foundClient} len=${bodyClients.length}`)
  if(!foundClient) log('  WARN: client not found in list - checking dashboard pipeline')
  // Find client ID via API through fetch inside page
  const clientId=await page.evaluate(async (uniq)=>{
    const token=localStorage.getItem('csm.accessToken')
    const res=await fetch(`/api/v1/clients?search=E2E%20Corp%20${uniq}`,{headers:{Authorization:`Bearer ${token}`}})
    const j=await res.json(); return j.data?.[0]?._id || j.data?.clients?.[0]?._id || null
  },uniq)
  log(`Marketing: clientId via API=${clientId}`)
  let submitted=false
  if(clientId){
    try{
      // submit client
      const res=await page.evaluate(async (id)=>{
        const token=localStorage.getItem('csm.accessToken')
        const r=await fetch(`/api/v1/clients/${id}/submit`,{method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({note:'e2e test'})})
        return {status:r.status, text:await r.text()}
      },clientId)
      log(`Marketing: submit response ${res.status} ${res.text.slice(0,300)}`)
      submitted=res.status===200
    }catch(e){ log('Marketing submit error '+e.message)}
  }
  // Also try clicking Submit button in client detail
  if(!submitted && clientId){
    await page.goto(`${BASE}/clients/${clientId}`,{waitUntil:'networkidle'}); await page.waitForTimeout(1500)
    const submitBtn=page.getByRole('button',{name:'Submit'})
    if(await submitBtn.count()){
      await submitBtn.click(); await page.waitForTimeout(1500)
      log('Marketing: clicked Submit button on detail page')
    }
  }
  await ctx.close()

  // --- ADMIN approve ---
  log('=== ADMIN approve client ===')
  ctx=await browser.newContext()
  page=await ctx.newPage()
  page.on('response',r=>{ if(r.url().includes('/api') && r.status()>=400) errors.push(`ADMIN ${r.request().method()} ${r.url().split('/api')[1].slice(0,80)} -> ${r.status()}`)})
  await login(page,'admin@csm.app')
  await page.waitForTimeout(2000)
  // Check dashboard shows pending approvals
  const adminBody=await page.textContent('body')
  log(`Admin dashboard len=${adminBody.length} has Pending? ${adminBody.includes('Pending')}`)
  // Try to approve via client detail
  if(clientId){
    await page.goto(`${BASE}/clients/${clientId}`,{waitUntil:'networkidle'}); await page.waitForTimeout(1500)
    const approveBtn=page.getByRole('button',{name:'Approve'})
    if(await approveBtn.count()){
      await approveBtn.click(); await page.waitForTimeout(2000)
      log('Admin: clicked Approve on client detail')
      const after=await page.textContent('body')
      log(`  after approve body has APPROVED? ${after.includes('APPROVED')} / status? ${after.slice(0,300).replace(/\n/g,' ').slice(0,150)}`)
    } else {
      log('Admin: Approve button not found, trying API')
      const res=await page.evaluate(async (id)=>{
        const token=localStorage.getItem('csm.accessToken')
        const r=await fetch(`/api/v1/clients/${id}/approve`,{method:'POST', headers:{Authorization:`Bearer ${token}`}})
        return {status:r.status, text:await r.text()}
      },clientId)
      log(`Admin: approve API ${res.status} ${res.text.slice(0,300)}`)
    }
    // Verify approval -> fetch client again
    const statusAfter=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/clients/${id}`,{headers:{Authorization:`Bearer ${token}`}})
      const j=await r.json(); return j.data?.status || 'unknown'
    },clientId)
    log(`Admin: client status after approve=${statusAfter}`)
    // Check project created
    const projectInfo=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/projects?limit=100`,{headers:{Authorization:`Bearer ${token}`}})
      const j=await r.json(); const projs=j.data||[]; const p=projs.find(x=>x.clientId===id) || projs[0]; return p
    },clientId)
    log(`Admin: project created? ${projectInfo ? projectInfo._id+' '+projectInfo.name+' status='+projectInfo.status : 'none'}`)
    globalThis.projectId=projectInfo?.['_id'] || null
  }
  await ctx.close()
  let projectId=globalThis.projectId

  // --- TASK MANAGEMENT: create tasks ---
  log('=== TASK MANAGEMENT create tasks ===')
  ctx=await browser.newContext()
  page=await ctx.newPage()
  page.on('response',r=>{ if(r.url().includes('/api') && r.status()>=400) errors.push(`TASKMGR ${r.request().method()} ${r.url().split('/api')[1].slice(0,80)} -> ${r.status()}`)})
  await login(page,'taskmanager@csm.app')
  // Create content task via UI modal
  await page.goto(`${BASE}/tasks`,{waitUntil:'networkidle'}); await page.waitForTimeout(1500)
  const createBtn=page.locator('main').getByRole('button',{name:'Create Task'})
  if(await createBtn.count()){
    await createBtn.click(); await page.waitForTimeout(800)
    await page.fill('input[name="title"]',`E2E Content Task ${uniq}`)
    const desc=page.locator('textarea[name="description"]')
    if(await desc.count()) await desc.fill('Create blog content')
    // Select project if available
    const projSel=page.locator('select[name="projectId"]')
    if(await projSel.count() && projectId){
      await projSel.selectOption(projectId)
    } else if(await projSel.count()){
      const opts=await projSel.evaluate(s=>Array.from(s.options).map(o=>o.value).filter(v=>v))
      if(opts.length) await projSel.selectOption(opts[0])
    }
    const teamSel=page.locator('select[name="assignedTeam"]')
    if(await teamSel.count()) await teamSel.selectOption('CONTENT_TEAM')
    await page.waitForTimeout(500)
    const assigneeSel=page.locator('select[name="assignedTo"]')
    if(await assigneeSel.count()){
      // get content team user id via API
      const cUser=await page.evaluate(async ()=>{
        const token=localStorage.getItem('csm.accessToken')
        const r=await fetch('/api/v1/users?limit=100',{headers:{Authorization:`Bearer ${token}`}})
        const j=await r.json(); const users=j.data||[]; const u=users.find(x=>x.role==='CONTENT_TEAM') || users[0]; return u?._id
      })
      if(cUser) await assigneeSel.selectOption(cUser)
    }
    // priority/dates
    const prio=page.locator('select[name="priority"]')
    if(await prio.count()) await prio.selectOption('HIGH')
    await page.click('button[type="submit"]'); await page.waitForTimeout(2000)
    log('TaskMgr: content task created via UI')
    const afterTask=await page.textContent('body')
    log(`  after content task body len ${afterTask.length}`)
  }
  // Create media task via API fallback if UI failed or for second task
  let contentTaskId, mediaTaskId
  const tasksAfter=await page.evaluate(async ()=>{
    const token=localStorage.getItem('csm.accessToken')
    const r=await fetch('/api/v1/tasks?limit=100',{headers:{Authorization:`Bearer ${token}`}})
    const j=await r.json(); return j.data||[]
  })
  log(`TaskMgr: tasks found ${tasksAfter.length}, titles: ${tasksAfter.slice(0,3).map(t=>t.title).join(' | ')}`)
  contentTaskId=tasksAfter.find(t=>t.title.includes(`E2E Content Task`))?._id
  // Create media task via API if not exists
  if(!tasksAfter.find(t=>t.title.includes(`E2E Media Task`))){
    const mediaAssignee=await page.evaluate(async ()=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch('/api/v1/users?limit=100',{headers:{Authorization:`Bearer ${token}`}})
      const j=await r.json(); const users=j.data||[]; const u=users.find(x=>x.role==='MEDIA_TEAM'); return u?._id
    })
    const projForMedia=projectId || tasksAfter[0]?.projectId || null
    const res=await page.evaluate(async ({title,team,assignee,proj})=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch('/api/v1/tasks',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({title, description:'Create video asset', projectId:proj, taskType:'MEDIA', priority:'HIGH', assignedTeam:team, assignedTo:assignee})})
      return {status:r.status, text:await r.text()}
    },{title:`E2E Media Task ${uniq}`,team:'MEDIA_TEAM',assignee:mediaAssignee,proj:projForMedia})
    log(`TaskMgr: media task API create ${res.status} ${res.text.slice(0,300)}`)
  }
  const tasksAfter2=await page.evaluate(async ()=>{
    const token=localStorage.getItem('csm.accessToken')
    const r=await fetch('/api/v1/tasks?limit=100',{headers:{Authorization:`Bearer ${token}`}})
    const j=await r.json(); return j.data||[]
  })
  mediaTaskId=tasksAfter2.find(t=>t.title.includes(`E2E Media Task`))?._id
  log(`TaskMgr: contentTaskId=${contentTaskId} mediaTaskId=${mediaTaskId}`)

  // Test Kanban move persistence
  await page.goto(`${BASE}/kanban`,{waitUntil:'networkidle'}); await page.waitForTimeout(1500)
  const kanbanBody=await page.textContent('body')
  log(`Kanban board loaded len=${kanbanBody.length} has ${kanbanBody.includes('Pending')?'Pending ':''}${kanbanBody.includes('In Progress')?'In Progress':''}`)
  if(contentTaskId){
    const moveRes=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/tasks/${id}/status`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({status:'IN_PROGRESS'})})
      return {status:r.status, text:await r.text()}
    },contentTaskId)
    log(`Kanban: move content task to IN_PROGRESS via API ${moveRes.status}`)
    await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(1500)
    const afterMove=await page.textContent('body')
    log(`Kanban after reload has IN_PROGRESS? ${afterMove.includes('In Progress')}`)
    // revert check via API
    const verify=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/tasks/${id}`,{headers:{Authorization:`Bearer ${token}`}})
      const j=await r.json(); return j.data?.status
    },contentTaskId)
    log(`Kanban: verified status persisted=${verify}`)
  }
  await ctx.close()

  // --- CONTENT TEAM: create content ---
  log('=== CONTENT TEAM create content ===')
  ctx=await browser.newContext()
  page=await ctx.newPage()
  page.on('response',r=>{ if(r.url().includes('/api') && r.status()>=400 && !r.url().includes('notifications')) errors.push(`CONTENT ${r.request().method()} ${r.url().split('/api')[1].slice(0,80)} -> ${r.status()}`)})
  await login(page,'content@csm.app')
  await page.waitForTimeout(1500)
  const contentBody=await page.textContent('body')
  log(`Content dashboard len=${contentBody.length}`)
  // Open New Content modal from dashboard
  const newContentBtn=page.getByRole('button',{name:'New Content'})
  let contentId=null
  if(await newContentBtn.count()){
    await newContentBtn.click(); await page.waitForTimeout(800)
    // Select project
    const sel=page.locator('select').first()
    if(projectId && await sel.count()){
      try{ await sel.selectOption(projectId) }catch{}
    } else {
      // try to pick first option
      const opts=await page.evaluate(()=>{
        const s=document.querySelector('select')
        return s? Array.from(s.options).map(o=>o.value).filter(v=>v).slice(0,2):[]
      })
      if(opts.length) await page.selectOption('select',opts[0])
    }
    await page.fill('input[placeholder="e.g. Summer Campaign Hero Copy"]','E2E Hero Copy '+uniq)
    await page.click('button[type="submit"]'); await page.waitForTimeout(2000)
    log('Content: created via dashboard modal')
  }
  // fallback via API
  contentId=await page.evaluate(async ({uniq,proj,task})=>{
    const token=localStorage.getItem('csm.accessToken')
    let r=await fetch('/api/v1/content?limit=100',{headers:{Authorization:`Bearer ${token}`}})
    let j=await r.json(); let items=j.data||[]; let found=items.find(c=>c.title && c.title.includes(uniq))
    if(found) return found._id
    // create via API
    const body={title:`E2E Hero Copy ${uniq}`, shortDescription:'Test short', projectId:proj, taskId:task}
    r=await fetch('/api/v1/content',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
    const txt=await r.text(); try{ const jj=JSON.parse(txt); return jj.data?._id || jj._id }catch{ return null }
  },{uniq,proj:projectId,task:contentTaskId})
  log(`Content: contentId=${contentId}`)
  if(contentId){
    // save draft via API (update)
    const upd=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/content/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({longDescription:'Full article body for E2E test', captions:['caption1'], cta:'Buy now', hashtags:['test']})})
      return {status:r.status, text:await r.text()}
    },contentId)
    log(`Content: update draft ${upd.status}`)
    const subm=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/content/${id}/submit`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({changes:'Initial submit'})})
      return {status:r.status, text:await r.text()}
    },contentId)
    log(`Content: submit ${subm.status} ${subm.text.slice(0,250)}`)
    // verify persisted after refresh
    await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(1500)
    const verify=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/content/${id}`,{headers:{Authorization:`Bearer ${token}`}})
      const j=await r.json(); return j.data?.status
    },contentId)
    log(`Content: verified status after reload=${verify}`)
    // check version history
    const vers=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/content/${id}/versions`,{headers:{Authorization:`Bearer ${token}`}})
      const j=await r.json(); return j.data||[]
    },contentId)
    log(`Content: versions count=${vers.length} vs=${vers.map(v=>v.versionNumber).join(',')}`)
  }
  await ctx.close()

  // --- MEDIA TEAM: upload ---
  log('=== MEDIA TEAM upload ===')
  ctx=await browser.newContext()
  page=await ctx.newPage()
  page.on('response',r=>{ if(r.url().includes('/api') && r.status()>=400 && !r.url().includes('notifications')) errors.push(`MEDIA ${r.request().method()} ${r.url().split('/api')[1].slice(0,80)} -> ${r.status()}`)})
  await login(page,'media@csm.app')
  let mediaId=null
  // Try upload via API (since file picker needs real file)
  mediaId=await page.evaluate(async ({proj,task})=>{
    const token=localStorage.getItem('csm.accessToken')
    // create a dummy file via FormData using Blob
    const fd=new FormData()
    const blob=new Blob(['dummy image content'],{type:'image/png'})
    fd.append('file',blob,'e2e-test.png')
    fd.append('projectId',proj)
    if(task) fd.append('taskId',task)
    fd.append('fileType','image')
    const r=await fetch('/api/v1/media',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd})
    const txt=await r.text()
    try{ const j=JSON.parse(txt); return j.data?._id || j._id || 'done-'+r.status }catch{ return txt.slice(0,100) }
  },{proj:projectId,task:mediaTaskId})
  log(`Media: upload result=${String(mediaId).slice(0,150)}`)
  // verify list
  const mediaList=await page.evaluate(async ()=>{
    const token=localStorage.getItem('csm.accessToken')
    const r=await fetch('/api/v1/media?limit=100',{headers:{Authorization:`Bearer ${token}`}})
    const j=await r.json(); return j.data||[]
  })
  log(`Media: list count=${mediaList.length} first file=${mediaList[0]?.fileName||'none'}`)
  const realMediaId=mediaList.find(m=>m.fileName && m.fileName.includes('e2e'))?._id || mediaList[0]?._id
  if(realMediaId){
    const vers=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/media/${id}`,{headers:{Authorization:`Bearer ${token}`}})
      const j=await r.json(); return j.data
    },realMediaId)
    log(`Media: detail status=${vers?.status} version=${vers?.version}`)
    // submit for review if endpoint exists - try via status update or submit?
    // Check media controller for submit? Look for /media/:id/status or similar
  }
  await ctx.close()

  // --- ADMIN approve content/media ---
  log('=== ADMIN approve content/media ===')
  ctx=await browser.newContext()
  page=await ctx.newPage()
  await login(page,'admin@csm.app')
  // approve content
  if(contentId){
    const approvals=await page.evaluate(async (cid)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/approvals?entityType=CONTENT&status=PENDING&limit=50`,{headers:{Authorization:`Bearer ${token}`}})
      const j=await r.json(); return j.data||[]
    },contentId)
    const target=approvals.find(a=>a.entityId===contentId) || approvals[0]
    if(target){
      const res=await page.evaluate(async (id)=>{
        const token=localStorage.getItem('csm.accessToken')
        const r=await fetch(`/api/v1/approvals/${id}/approve`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({comment:'approve via e2e'})})
        return {status:r.status, text:await r.text()}
      },target._id)
      log(`Admin: approve content approval ${target._id} -> ${res.status} ${res.text.slice(0,200)}`)
    } else {
      log(`Admin: no pending CONTENT approval found for ${contentId}, found ${approvals.length}`)
    }
  }
  // approve media (approvals may be for MEDIA)
  const mediaApprovals=await page.evaluate(async ()=>{
    const token=localStorage.getItem('csm.accessToken')
    const r=await fetch(`/api/v1/approvals?entityType=MEDIA&status=PENDING&limit=50`,{headers:{Authorization:`Bearer ${token}`}})
    const j=await r.json(); return j.data||[]
  })
  log(`Admin: pending MEDIA approvals ${mediaApprovals.length}`)
  for(const a of mediaApprovals.slice(0,1)){
    const res=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/approvals/${id}/approve`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({comment:'approve media'})})
      return {status:r.status, text:await r.text()}
    },a._id)
    log(`Admin: approve media ${a._id} -> ${res.status}`)
  }
  // also try to approve any remaining PENDING approvals for this project
  const projApprovals=await page.evaluate(async (pid)=>{
    const token=localStorage.getItem('csm.accessToken')
    const r=await fetch(`/api/v1/approvals?projectId=${pid}&status=PENDING&limit=50`,{headers:{Authorization:`Bearer ${token}`}})
    const j=await r.json(); return j.data||[]
  },projectId)
  log(`Admin: pending approvals for project ${projApprovals.length}`)
  for(const a of projApprovals){
    const res=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/approvals/${id}/approve`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({comment:'approve project related'})})
      return {status:r.status, text:await r.text()}
    },a._id)
    log(`Admin: approve project approval ${a.entityType} ${a._id} -> ${res.status}`)
  }
  // verify content/media status after approval
  if(contentId){
    const st=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/content/${id}`,{headers:{Authorization:`Bearer ${token}`}})
      const j=await r.json(); return j.data?.status
    },contentId)
    log(`Admin: content status after approve=${st}`)
  }
  await ctx.close()
  // set password for e2e client so we can login as that client for approval
  const e2eEmail=`e2e${uniq}@testcorp.com`
  try{ await setClientPassword(e2eEmail, PASS); log(`Set password for ${e2eEmail}`)}catch(e){ log('Failed to set password for e2e client: '+e.message)}

  // --- CLIENT approval ---
  log('=== CLIENT review & approval ===')
  ctx=await browser.newContext()
  page=await ctx.newPage()
  page.on('response',r=>{ if(r.url().includes('/api') && r.status()>=400) errors.push(`CLIENT ${r.request().method()} ${r.url().split('/api')[1].slice(0,80)} -> ${r.status()}`)})
  // try login as e2e client first, fallback to demo client
  let clientLoginEmail=e2eEmail
  try{
    await login(page,e2eEmail)
    log(`Client: logged in as ${e2eEmail}`)
  }catch(e){
    log(`Client: login as ${e2eEmail} failed ${e.message.slice(0,100)}, trying demo client`)
    clientLoginEmail='client@csm.app'
    await login(page,'client@csm.app')
  }
  await page.goto(`${BASE}/projects/${projectId}`,{waitUntil:'networkidle'}); await page.waitForTimeout(1500)
  const clientProjBody=await page.textContent('body')
  log(`Client project page len=${clientProjBody.length} has Approve? ${clientProjBody.includes('Approve')}`)
  const approveBtnClient=page.getByRole('button',{name:'Approve Project'})
  if(await approveBtnClient.count()){
    await approveBtnClient.click(); await page.waitForTimeout(1500)
    log('Client: clicked Approve Project button')
  } else {
    log('Client: Approve Project button not found, trying API')
    const res=await page.evaluate(async (id)=>{
      const token=localStorage.getItem('csm.accessToken')
      const r=await fetch(`/api/v1/projects/${id}/client-approve`,{method:'POST',headers:{Authorization:`Bearer ${token}`}})
      return {status:r.status, text:await r.text()}
    },projectId)
    log(`Client: client-approve API ${res.status} ${res.text.slice(0,250)}`)
  }
  // Verify clientApproved persisted
  const projAfterClient=await page.evaluate(async (id)=>{
    const token=localStorage.getItem('csm.accessToken')
    const r=await fetch(`/api/v1/projects/${id}`,{headers:{Authorization:`Bearer ${token}`}})
    const j=await r.json(); return j.data
  },projectId)
  log(`Client: project clientApproved=${projAfterClient?.clientApproved} status=${projAfterClient?.status}`)
  await ctx.close()

  // --- ADMIN publish ---
  log('=== ADMIN publish ===')
  ctx=await browser.newContext()
  page=await ctx.newPage()
  page.on('response',r=>{ if(r.url().includes('/api') && r.status()>=400) errors.push(`ADMIN2 ${r.request().method()} ${r.url().split('/api')[1].slice(0,80)} -> ${r.status()}`)})
  await login(page,'admin@csm.app')
  // Transition to READY_TO_PUBLISH before publish
  const readyRes=await page.evaluate(async (id)=>{
    const token=localStorage.getItem('csm.accessToken')
    const r=await fetch(`/api/v1/projects/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({status:'READY_TO_PUBLISH'})})
    return {status:r.status, text:await r.text()}
  },projectId)
  log(`Admin: transition to READY_TO_PUBLISH ${readyRes.status} ${readyRes.text.slice(0,200)}`)
  // Try to publish via Ready to Publish page
  await page.goto(`${BASE}/ready-to-publish`,{waitUntil:'networkidle'}); await page.waitForTimeout(1500)
  let pubBody=await page.textContent('body')
  log(`ReadyToPublish page len=${pubBody.length} has project? ${pubBody.includes(projectId?projectId.slice(-4):'none')} bodyHasReady? ${pubBody.includes('Ready to Publish')}`)
  // Verify publish button visible
  const pubBtn=page.getByRole('button',{name:'Approve & Publish'})
  if(await pubBtn.count()){
    log('Admin: Publish button found on ReadyToPublish page, clicking')
    await pubBtn.first().click(); await page.waitForTimeout(800)
    const confirm=page.getByRole('button',{name:'Confirm Publish'})
    if(await confirm.count()){ await confirm.click(); await page.waitForTimeout(1500); log('Admin: Confirmed publish via UI')}
  }
  // Try direct publish API
  const pubRes=await page.evaluate(async (id)=>{
    const token=localStorage.getItem('csm.accessToken')
    const r=await fetch(`/api/v1/projects/${id}/publish`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({})})
    return {status:r.status, text:await r.text()}
  },projectId)
  log(`Admin: publish API ${pubRes.status} ${pubRes.text.slice(0,300)}`)
  const projFinal=await page.evaluate(async (id)=>{
    const token=localStorage.getItem('csm.accessToken')
    const r=await fetch(`/api/v1/projects/${id}`,{headers:{Authorization:`Bearer ${token}`}})
    const j=await r.json(); return j.data
  },projectId)
  log(`Admin: final project status=${projFinal?.status} clientApproved=${projFinal?.clientApproved} adminApproved=${projFinal?.adminApproved}`)

  await ctx.close()
  await browser.close()
  log('=== ERRORS collected ===')
  errors.forEach(e=>log('  '+e))
  fs.writeFileSync(`${OUT}/e2e-report.txt`, report.join('\n'))
  console.log('REPORT WRITTEN')
}
run().catch(e=>{ console.error(e); process.exit(1)})
