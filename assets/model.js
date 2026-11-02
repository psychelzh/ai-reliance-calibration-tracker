export const STATUS = {todo:'待开始',doing:'进行中',waiting:'等待条件',blocked:'受阻',done:'已完成',cancelled:'已取消'};
export function issueTask(issue) {
  const labels=(issue.labels||[]).map(v=>typeof v==='string'?v:v.name);
  const body=issue.body||'';
  const meta=body.match(/<!-- tracker:id=([A-Z]\d+);deps=([A-Z\d,]*) -->/);
  const id=meta?.[1]||`GH${issue.number}`;
  const deps=meta?.[2]?meta[2].split(','):[];
  let status='todo';
  if(issue.state==='closed') status=issue.state_reason==='not_planned'?'cancelled':'done';
  else if(labels.includes('status:blocked')) status='blocked';
  else if(labels.includes('status:waiting')) status='waiting';
  else if(labels.includes('status:doing')) status='doing';
  const summary=(body.replace(/<!--[\s\S]*?-->/g,'').split(/^## /m)[0]||'').trim();
  const acceptance=(body.match(/## 验收条件\n([\s\S]*?)(?:\n## |$)/)?.[1]||'')
    .split('\n').filter(line=>/^- \[[ xX]\]/.test(line)).map(line=>line.replace(/^- \[[ xX]\]\s*/,''));
  return {number:issue.number,id,deps,status,title:issue.title.replace(/^\[[A-Z]\d+\]\s*/,''),summary,acceptance,
    phase:labels.find(v=>v.startsWith('phase:'))?.slice(6)||'other',
    priority:labels.find(v=>v.startsWith('priority:'))?.slice(9)||'P2',updatedAt:issue.updated_at};
}
export function taskStats(tasks){
  const active=tasks.filter(t=>t.status!=='cancelled');
  return {total:active.length,done:active.filter(t=>t.status==='done').length,
    doing:active.filter(t=>t.status==='doing').length,
    waiting:active.filter(t=>['waiting','blocked'].includes(t.status)).length};
}
export function nextTasks(tasks){
  const done=new Set(tasks.filter(t=>t.status==='done').map(t=>t.id));
  return tasks.filter(t=>['todo','doing'].includes(t.status)&&t.deps.every(dep=>done.has(dep)))
    .sort((a,b)=>a.priority.localeCompare(b.priority)||(a.status==='doing'?-1:0)-(b.status==='doing'?-1:0)||a.number-b.number).slice(0,3);
}
