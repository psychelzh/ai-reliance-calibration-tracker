import {STATUS,issueTask,taskStats,nextTasks} from './model.js';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={config:null,tasks:[],snapshot:null,busy:false};
const time=value=>value?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)):'时间未记录';
async function request(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),10000);
  try{const response=await fetch(url,{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`HTTP ${response.status}`);return await response.json();}finally{clearTimeout(timer);}
}
const issueUrl=number=>`https://github.com/${state.config.repo}/issues/${Number(number)}`;
function phaseName(id){return state.config.phases.find(p=>p.id===id)?.name||'其他任务';}
function renderConfig(){
  const c=state.config;
  $('project-status').textContent=c.status;
  $('sidebar-status').textContent=`当前：${c.status}`;
  $('cycle').textContent=c.cycle;
  $('status-note').textContent=c.statusNote;
  document.querySelector('.stat-focus strong').textContent=c.focus||phaseName(c.currentPhase);
  document.querySelector('.stat-focus small').textContent=c.researchStatus||'真实参与者研究尚未启动';
  $('phase-filter').innerHTML='<option value="all">全部阶段</option>'+c.phases.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')+'<option value="other">其他任务</option>';
  $('weeks').innerHTML=c.weeks.map((w,i)=>`<article class="week-card"><time>${esc(w.date)}</time><span class="week-no">WEEK ${String(i+1).padStart(2,'0')}</span><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></article>`).join('');
  $('gate-list').innerHTML=c.gates.map(g=>`<article class="gate-item"><h3>${esc(g.title)}</h3><p>${esc(g.text)}</p></article>`).join('');
  $('roadmap-list').innerHTML=c.roadmap.map(r=>`<article class="roadmap-item"><span class="year">${esc(r.year)}</span><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></article>`).join('');
}
function renderSummary(){
  const tasks=state.tasks,stats=taskStats(tasks);
  $('stat-done').textContent=stats.done;
  $('stat-total').textContent=`共 ${stats.total} 项有效任务`;
  $('stat-doing').textContent=stats.doing;
  $('stat-waiting').textContent=stats.waiting;
  $('phase-journey').innerHTML=state.config.phases.map((p,i)=>{
    const group=tasks.filter(t=>t.phase===p.id&&t.status!=='cancelled');
    const done=group.filter(t=>t.status==='done').length;
    return `<button type="button" class="phase-step ${p.id===state.config.currentPhase?'current':''}" data-phase="${esc(p.id)}" aria-label="查看${esc(p.name)}任务"><span class="phase-dot">${String(i+1).padStart(2,'0')}</span><strong>${esc(p.name)}</strong><small>${done} / ${group.length} 已验收</small></button>`;
  }).join('');
  $('phase-journey').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
    $('phase-filter').value=button.dataset.phase;$('status-filter').value='all';$('search').value='';renderTasks();$('tasks').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }));
  const next=nextTasks(tasks);
  $('next-actions').innerHTML=next.length?next.map((t,i)=>`<article class="next-card"><div class="card-top"><span>0${i+1} / ${esc(t.id)}</span><span class="priority ${esc(t.priority)}">${esc(t.priority)}</span></div><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p><a href="${issueUrl(t.number)}" target="_blank" rel="noopener noreferrer">打开任务 #${t.number} ↗</a></article>`).join(''):'<p class="empty">当前没有满足前置条件的待办任务。请检查等待条件与已完成任务。</p>';
}
function renderTasks(){
  const search=$('search').value.trim().toLowerCase(),phase=$('phase-filter').value,status=$('status-filter').value;
  const tasks=state.tasks.filter(t=>(phase==='all'||t.phase===phase)&&(status==='all'||t.status===status)&&`${t.id} ${t.number} ${t.title} ${t.summary} ${t.acceptance.join(' ')}`.toLowerCase().includes(search));
  const byId=new Map(state.tasks.map(t=>[t.id,t]));
  $('task-list').innerHTML=tasks.length?tasks.map(t=>{
    const deps=t.deps.length?t.deps.map(id=>{const dep=byId.get(id);return dep?`<a href="${issueUrl(dep.number)}" target="_blank" rel="noopener noreferrer">${esc(id)} ${dep.status==='done'?'✓':'待完成'}</a>`:esc(id);}).join(' · '):'无前置任务';
    return `<details class="task-row" data-status="${esc(t.status)}"><summary class="task-summary"><span class="task-title"><span class="task-icon" aria-hidden="true">${t.status==='done'?'✓':'+'}</span><span class="task-name"><small>${esc(t.id)}</small>${esc(t.title)}</span></span><span class="task-phase">${esc(phaseName(t.phase))}</span><span class="status ${esc(t.status)}">${STATUS[t.status]}</span><span class="priority ${esc(t.priority)}">${esc(t.priority)}</span></summary><div class="task-detail"><p>${esc(t.summary)}</p>${t.acceptance.length?`<strong>验收条件</strong><ul>${t.acceptance.map(a=>`<li>${esc(a)}</li>`).join('')}</ul>`:''}<p>前置任务：${deps}</p><div class="detail-bottom"><a href="${issueUrl(t.number)}" target="_blank" rel="noopener noreferrer">查看／更新 Issue #${t.number} ↗</a><span>更新于 ${esc(time(t.updatedAt))}（北京时间）</span></div></div></details>`;
  }).join(''):'<p class="empty">没有匹配的任务，试试调整关键词或筛选条件。</p>';
  $('filter-count').textContent=`显示 ${tasks.length} / ${state.tasks.length} 项任务 · 点击任务展开验收条件与前置任务`;
}
function applyIssues(issues){
  state.tasks=issues.filter(v=>!v.pull_request).map(issueTask).sort((a,b)=>a.number-b.number);renderSummary();renderTasks();
}
function showSource(mode,stamp){
  const box=$('data-message');box.classList.toggle('is-fallback',mode!=='live');
  box.textContent=mode==='live'?`● GitHub 实时任务 · 读取于 ${time(stamp)}（北京时间） · 公开摘要`:mode==='checking'?`正在读取 GitHub；暂显示发布快照 ${time(stamp)}（北京时间）`:`GitHub 最新状态暂不可用，当前显示发布快照 ${time(stamp)}（北京时间）。可稍后刷新或前往 GitHub 查看。`;
}
async function refresh(){
  if(state.busy)return;
  state.busy=true;$('refresh').disabled=true;
  try{
    const issues=[];
    for(let page=1;;page++){
      const part=await request(`https://api.github.com/repos/${state.config.repo}/issues?state=all&labels=task&per_page=100&page=${page}`);
      if(!Array.isArray(part))throw new Error('Invalid issues');
      issues.push(...part);if(part.length<100)break;
    }
    applyIssues(issues);showSource('live',new Date().toISOString());
  }catch{
    if(state.snapshot){applyIssues(state.snapshot.issues);showSource('snapshot',state.snapshot.generatedAt);}
    else{$('data-message').textContent='任务暂时无法载入。请刷新，或通过“管理任务”前往 GitHub 查看。';$('data-message').classList.add('is-fallback');}
  }finally{state.busy=false;$('refresh').disabled=false;}
}
async function init(){
  try{
    state.config=await request('./data/project.json');
    if(!/^[\w.-]+\/[\w.-]+$/.test(state.config.repo))throw new Error('Invalid repository');
    renderConfig();
    const snapshotPromise=request('./data/issues-snapshot.json').then(snapshot=>{state.snapshot=snapshot;if(!state.tasks.length){applyIssues(snapshot.issues);showSource('checking',snapshot.generatedAt);}}).catch(()=>{});
    await snapshotPromise;
    ['search','phase-filter','status-filter'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',renderTasks));
    $('refresh').addEventListener('click',refresh);
    document.querySelectorAll('.nav-link').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));link.classList.add('active');}));
    await refresh();
  }catch{$('data-message').textContent='项目配置载入失败。可通过“管理任务”查看 GitHub 记录。';$('data-message').classList.add('is-fallback');$('refresh').disabled=true;}
}
init();
