// Explanations use the same observed state and greedy ordering as the policy.
// No latent traits, future events or counterfactual outcomes are consulted.
import {HARD,SOFT,observe,eligibility,graphEdges} from './engine.mjs';
const key=p=>p.slice().sort().join('|');
const display=v=>v==null?'Unknown':Array.isArray(v)?v.join(', '):String(v);

export function explainPair(s,aId,bId){
 const state=observe(s),a=state.members.find(m=>m.member_id===aId),b=state.members.find(m=>m.member_id===bId);
 if(!a||!b||aId===bId)throw Error('Choose two different arrived members.');
 const names=new Map(s.members.map(m=>[m.member_id,m.name])),name=m=>names.get(m.member_id),f=a.fields,g=b.fields;
 const value=(m,k)=>({value:m.fields[k]??null,status:m.field_status[k]??'not_asked',observed_day:m.field_observed_day[k]??null});
 const attributes=[...HARD,...SOFT].map(field=>({field,kind:HARD.includes(field)?'hard':'soft',left:value(a,field),right:value(b,field)}));
 const checks=[];
 const add=(id,title,known,failed,detail)=>checks.push({id,title,status:failed?'fail':known?'pass':'unknown',detail});
 add('pool','Same pool',true,a.pool_id!==b.pool_id,`${name(a)}: ${a.pool_id}; ${name(b)}: ${b.pool_id}.`);
 add('adult','Both adults',true,Math.min(a.age,b.age)<18,`${name(a)}: age ${a.age}; ${name(b)}: age ${b.age}. Both must be at least 18.`);
 for(const[x,y,fx,fy]of[[a,b,f,g],[b,a,g,f]]){
  const prefix=x.member_id;
  add(prefix+':age',`${name(x)} — age preference`,fx.age_min!=null&&fx.age_max!=null,(fx.age_min!=null&&y.age<fx.age_min)||(fx.age_max!=null&&y.age>fx.age_max),`Accepts ages ${display(fx.age_min)}–${display(fx.age_max)}; ${name(y)} is age ${y.age}.`);
  add(prefix+':who_to_meet',`${name(x)} — who to meet`,fx.who_to_meet!=null,fx.who_to_meet!=null&&!fx.who_to_meet.includes(y.gender),`Accepts ${display(fx.who_to_meet)}; ${name(y)}: ${y.gender}.`);
  add(prefix+':geography',`${name(x)} — location`,fx.acceptable_zones!=null,fx.acceptable_zones!=null&&!fx.acceptable_zones.includes(y.zone),`Accepts ${display(fx.acceptable_zones)}; ${name(y)}: ${y.zone}.`);
  add(prefix+':smoking',`${name(x)} — smoking preference`,fx.partner_smoking!=null&&fy.smoking!=null,fx.partner_smoking==='no_smoking'&&['yes','occasionally'].includes(fy.smoking),`Partner preference: ${display(fx.partner_smoking)}; ${name(y)} smoking: ${display(fy.smoking)}.`);
  add(prefix+':children_present',`${name(x)} — partner children`,fx.partner_children!=null&&fy.has_children!=null,fx.partner_children==='no_children'&&fy.has_children===true,`Partner preference: ${display(fx.partner_children)}; ${name(y)} has children: ${display(fy.has_children)}.`);
 }
 add('relationship_structure','Relationship structure',f.relationship_structure!=null&&g.relationship_structure!=null,f.relationship_structure!=null&&g.relationship_structure!=null&&f.relationship_structure!==g.relationship_structure,`${name(a)}: ${display(f.relationship_structure)}; ${name(b)}: ${display(g.relationship_structure)}. Values must agree.`);
 add('children_plans','Future children plans',f.wants_children!=null&&g.wants_children!=null,[f.wants_children,g.wants_children].includes('yes')&&[f.wants_children,g.wants_children].includes('no'),`${name(a)}: ${display(f.wants_children)}; ${name(b)}: ${display(g.wants_children)}. A Yes/No conflict blocks eligibility.`);
 add('schedule','Shared schedule',f.schedule!=null&&g.schedule!=null,f.schedule!=null&&g.schedule!=null&&!f.schedule.some(v=>g.schedule.includes(v)),`${name(a)}: ${display(f.schedule)}; ${name(b)}: ${display(g.schedule)}. At least one time slot must overlap.`);
 const soft=SOFT.map(field=>({field,left:value(a,field),right:value(b,field),status:f[field]==null||g[field]==null?'unknown':f[field]===g[field]?'agree':'disagree',points:Number(f[field]!=null&&f[field]===g[field])}));
 const score=soft.reduce((n,r)=>n+r.points,0),elig=eligibility(a,b),edges=s.day<60?graphEdges(state):[],target=key([aId,bId]),rank=edges.findIndex(e=>key(e.pair)===target),selected=[],used=new Set();let blockers=[];
 for(let index=0;index<edges.length;index++){
  const e=edges[index],conflicts=selected.filter(w=>w.pair.some(id=>e.pair.includes(id)));
  if(key(e.pair)===target)blockers=conflicts;
  if(e.pair.some(id=>used.has(id)))continue;
  selected.push({...e,rank:index+1});e.pair.forEach(id=>used.add(id));
 }
 const selectedNow=selected.some(e=>key(e.pair)===target),previous=state.introductions.find(i=>key([i.user_a,i.user_b])===target);
 const missing=attributes.filter(r=>r.kind==='hard'&&(r.left.value==null||r.right.value==null)).map(r=>({field:r.field,members:[...(r.left.value==null?[aId]:[]),...(r.right.value==null?[bId]:[])]}));
 const reasons=[];let status;
 if(s.day>=60)reasons.push({code:'horizon',text:'New introductions have ended. Days 60–99 only collect follow-up.'});
 for(const m of[a,b])if(!m.available)reasons.push({code:'unavailable',text:`${name(m)} is not currently available. Availability is a separate requirement from compatibility.`});
 if(previous)reasons.push({code:'previous_introduction',text:`This pair was already introduced on day ${previous.assigned_day}; repeat introductions are excluded.`});
 if(elig.status==='infeasible')reasons.push({code:'hard_constraint',text:'At least one disclosed hard constraint fails. See the failed checks below.'});
 if(missing.length)reasons.push({code:'missing_constraints',text:'Required hard attributes are unknown or declined. They cannot be assumed compatible; declined fields are not automatically asked again.'});
 if(reasons.length)status='blocked';
 else if(selectedNow){status='selected';reasons.push({code:'greedy_selected',text:'Selected in the current observed-state plan: eligible, not previously introduced, and neither member was used by an earlier pair.'});}
 else{status='not_selected';reasons.push({code:'allocation_conflict',text:'Eligible, but an earlier pair in the greedy ordering already used at least one member. This is an allocation decision, not a rejection or predicted failure.'});}
 return{day:s.day,policy:'conservative',scope:'Current observed-state plan; the next automatic step may clarify profiles and recompute it.',
  members:[a,b].map(m=>({member_id:m.member_id,name:name(m),age:m.age,gender:m.gender,zone:m.zone,available:m.available})),status,selected:selectedNow&&s.day<60,
  can_introduce:s.day<60&&a.available&&b.available&&!previous&&elig.status==='feasible',eligibility:elig.status,reasons,hard_checks:checks,missing,attributes,soft,score,score_max:SOFT.length,
  candidate_rank:rank<0?null:rank+1,candidate_count:edges.length,tie_break:'Higher agreement score first; exact ties use lexicographically sorted internal member IDs. Names and ages are not tie-break scores.',
  blockers:blockers.map(e=>({...e,names:e.pair.map(id=>names.get(id)),same_score:e.score===score})),previous_introduction:previous?{introduction_id:previous.introduction_id,assigned_day:previous.assigned_day,selection:previous.selection??null}:null};
}
