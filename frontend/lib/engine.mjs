// Server decision port of the public kit's conservative policy.
// Live outcomes use a separate seeded JS simulator, not the official Python RNG.
export const VERSION='conservative-js-1';
export const HARD=['age_min','age_max','who_to_meet','relationship_structure','smoking','partner_smoking','has_children','partner_children','wants_children','acceptable_zones','schedule'];
export const SOFT=['relationship_goal','relationship_pace','lifestyle','conversations','emotional_availability','space_for_relationship','relocate'];
const OPTIONS={relationship_goal:['long_term','exploring'],relationship_pace:['slow','steady','quick'],lifestyle:['quiet','mixed','social'],conversations:['ideas','stories','practical','playful'],emotional_availability:['ready','taking_time'],space_for_relationship:['limited','moderate','ample'],relocate:['yes','no','unsure']};
const pairKey=(a,b)=>[a,b].sort().join('|');
export function eligibility(a,b){
 if(a.member_id===b.member_id)return{status:'infeasible',reasons:['same_member']};
 if(a.pool_id!==b.pool_id)return{status:'infeasible',reasons:['different_pool']};
 if(Math.min(a.age,b.age)<18)return{status:'infeasible',reasons:['underage']};
 const f=a.fields,g=b.fields,missing=[],bad=[];
 for(const m of [a,b])for(const k of HARD)if(m.fields[k]==null)missing.push(`${m.member_id}:${k}`);
 for(const [x,y,fx,fy] of [[a,b,f,g],[b,a,g,f]]){
  if(fx.who_to_meet!=null&&!fx.who_to_meet.includes(y.gender))bad.push('who_to_meet');
  if(fx.age_min!=null&&y.age<fx.age_min||fx.age_max!=null&&y.age>fx.age_max)bad.push('age');
  if(fx.acceptable_zones!=null&&!fx.acceptable_zones.includes(y.zone))bad.push('geography');
  if(fx.partner_smoking==='no_smoking'&&['yes','occasionally'].includes(fy.smoking))bad.push('smoking');
  if(fx.partner_children==='no_children'&&fy.has_children===true)bad.push('children_present');
 }
 if(f.relationship_structure!=null&&g.relationship_structure!=null&&f.relationship_structure!==g.relationship_structure)bad.push('relationship_structure');
 if([f.wants_children,g.wants_children].includes('yes')&&[f.wants_children,g.wants_children].includes('no'))bad.push('children_plans');
 if(f.schedule!=null&&g.schedule!=null&&!f.schedule.some(v=>g.schedule.includes(v)))bad.push('schedule');
 return{status:bad.length?'infeasible':missing.length?'needs_clarification':'feasible',reasons:[...new Set(bad)].sort(),missing};
}
export function chooseAsks(state){
 const active=state.members.filter(m=>m.available),candidates=new Set(),past=new Set(state.introductions.map(i=>pairKey(i.user_a,i.user_b)));
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
  const a=active[i],b=active[j];if(past.has(pairKey(a.member_id,b.member_id))||[a,b].some(m=>HARD.some(k=>m.field_status[k]==='declined')))continue;
  if(eligibility(a,b).status==='needs_clarification')for(const m of [a,b])if(HARD.some(k=>m.fields[k]==null))candidates.add(m.member_id);
 }
 return state.members.filter(m=>candidates.has(m.member_id)).slice(0,Math.floor(state.ask_budget_remaining/3)).map(m=>({member_id:m.member_id,field:'constraints'}));
}
export function graphEdges(state){
 const active=state.members.filter(m=>m.available),past=new Set(state.introductions.map(i=>pairKey(i.user_a,i.user_b))),edges=[];
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
  const a=active[i],b=active[j];if(past.has(pairKey(a.member_id,b.member_id))||eligibility(a,b).status!=='feasible')continue;
  const agreements=SOFT.filter(k=>a.fields[k]!=null&&a.fields[k]===b.fields[k]);edges.push({pair:[a.member_id,b.member_id].sort(),score:agreements.length,agreements});
 }
 return edges.sort((a,b)=>b.score-a.score||(pairKey(...a.pair)<pairKey(...b.pair)?-1:1));
}
export function choosePairs(state){const used=new Set();return graphEdges(state).filter(e=>{if(e.pair.some(i=>used.has(i)))return false;e.pair.forEach(i=>used.add(i));return true;}).map(e=>e.pair);}
export function hash(text){let x=2166136261;for(const c of String(text)){x^=c.charCodeAt(0);x=Math.imul(x,16777619);}return x>>>0;}
function random(seed){let value=seed>>>0;const r=()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};r.int=(a,b)=>a+Math.floor(r()*(b-a+1));r.pick=xs=>xs[r.int(0,xs.length-1)];r.normal=(sd=1)=>Math.sqrt(-2*Math.log(Math.max(r(),1e-12)))*Math.cos(2*Math.PI*r())*sd;return r;}
const clone=x=>JSON.parse(JSON.stringify(x));
function convertFixture(m,i){
 const lower=v=>v.toLowerCase().replaceAll('-','_').replaceAll(' ','_');
 const truth={age_min:m.min,age_max:m.max,who_to_meet:m.who,relationship_structure:lower(m.structure),smoking:lower(m.smoking),partner_smoking:m.partnerSmoking==='Any'?'any':'no_smoking',has_children:m.children,partner_children:m.partnerChildren==='Any'?'any':'no_children',wants_children:lower(m.wantsChildren),acceptable_zones:m.zones,schedule:m.schedule.map(s=>s==='Evenings'?'weekday_evening':'weekend_day')};
 for(const k of SOFT)truth[k]=lower(m[k]);
 return{member_id:`live_${String(i).padStart(3,'0')}`,name:m.name,age:m.age,gender:m.gender,zone:m.zone,truth,fields:Object.fromEntries(Object.entries(truth).map(([k,v])=>[k,m.known||SOFT.includes(k)?clone(v):null])),declined:m.declined?'age_min':null,arrived_day:0,exit_day:10000,busy_until:m.available?0:8};
}
export function createSession(config,fixtures=[]){
 const seed=Number.isInteger(config.seed)?config.seed>>>0:2026,r=random(hash(`${seed}|${config.family||'development'}`));const pool=[];
 if(config.pool==='guided'){
  const extraNames=['Sama','Riya','Arjun','Naina','Kian','Sia','Ishan','Noor','Reva','Aadi','Niam','Rhea'];
  for(let i=0;i<24;i++){const m=convertFixture(fixtures[i%fixtures.length],i);if(i>=12)m.name=extraNames[i-12];pool.push(m);}
 }else{
  const genders=['woman','man','non_binary'];
  for(let i=0;i<200;i++){
   const age=r.int(21,46),gender=r()<.46?'woman':r()<.85?'man':'non_binary',zone=r.pick(config.family==='sparse'?Array.from({length:12},(_,i)=>`zone_${i}`):['zone_a','zone_a','zone_a','zone_a','zone_b','zone_c','zone_d']);
   const truth={age_min:Math.max(18,age-r.int(3,10)),age_max:Math.min(65,age+r.int(3,10)),who_to_meet:r()<.2?[...genders]:[r.pick(genders)],relationship_structure:r()<.9?'monogamous':'non_monogamous',smoking:r()<.75?'no':r.pick(['occasionally','yes']),partner_smoking:r.pick(['any','no_smoking']),has_children:r()<.15,partner_children:r.pick(['any','no_children']),wants_children:r.pick(['yes','no','unsure']),acceptable_zones:[zone],schedule:r()<.5?['weekday_evening','weekend_day']: [r.pick(['weekday_evening','weekend_day','weekend_evening'])]};
   for(const [k,values]of Object.entries(OPTIONS))truth[k]=r.pick(values);
   const complete=r()<(config.family==='cold_start'?.2:.35),fields={};for(const[k,v]of Object.entries(truth))fields[k]=complete||r()<.1?clone(v):null;
   pool.push({member_id:`live_${String(i).padStart(3,'0')}`,name:`Member ${String(i+1).padStart(3,'0')}`,age,gender,zone,truth,fields,arrived_day:r()<.7?0:r.int(1,20),exit_day:r()<.12?r.int(22,60):10000,busy_until:0});
  }
 }
 for(const m of pool){m.pool_id='live';m.field_status={};m.field_observed_day={};for(const[k,v]of Object.entries(m.fields)){m.field_status[k]=v!=null?'observed':m.declined===k||config.pool!=='guided'&&r()<.07?'declined':'not_asked';m.field_observed_day[k]=v!=null?m.arrived_day:null;}m.bias=r.normal(.7);m.second_bias=r.normal(.5);m.response_rate=.55+r()*.43;}
 return{version:1,engine:VERSION,day:0,seed,pool:config.pool,family:config.family||'development',members:pool,introductions:[],events:[],ask_log:[],ask_spent:0,asks_total:0,activity:[],last_decision:null};
}
function visibleEvents(s){return s.events.filter(e=>e.observed_day<=s.day);}
function available(s,m){return m.arrived_day<=s.day&&s.day<m.exit_day&&m.busy_until<=s.day&&!s.events.some(e=>e.event==='pause_after_mutual_interest'&&e.observed_day<=s.day&&e.members.includes(m.member_id));}
export function observe(s){return{schema_version:'1.0.0',synthetic:true,day:s.day,ask_budget_remaining:12-s.ask_spent,members:s.members.filter(m=>m.arrived_day<=s.day).map(m=>({member_id:m.member_id,pool_id:m.pool_id,synthetic:true,age:m.age,gender:m.gender,zone:m.zone,arrived_day:m.arrived_day,fields:clone(m.fields),field_status:clone(m.field_status),field_observed_day:clone(m.field_observed_day),source:'live_synthetic_world',available:available(s,m)})),introductions:clone(s.introductions),feedback:visibleEvents(s).map(({members,...e})=>e),ask_log:clone(s.ask_log)};}
const sigmoid=z=>1/(1+Math.exp(-z));
function emit(s,row){s.events.push(row);}
function activity(s,kind,text){s.activity.push({id:`a${s.activity.length}`,day:s.day,kind,text});}
export function clarify(s){
 if(s.day>=60)throw Error('Active decision horizon has ended');const state=observe(s),asks=chooseAsks(state);
 for(const ask of asks){const m=s.members.find(m=>m.member_id===ask.member_id);for(const k of HARD)if(m.field_status[k]!=='declined'){m.fields[k]=clone(m.truth[k]);m.field_status[k]='observed';m.field_observed_day[k]=s.day;}s.ask_log.push({...ask,observed_day:s.day});s.ask_spent+=3;s.asks_total+=3;activity(s,'clarification',`${m.name}: permitted hard constraints disclosed`);}
 return asks;
}
function introduce(s,pairs,manual=false){
 const state=observe(s),byId=new Map(state.members.map(m=>[m.member_id,m])),used=new Set();
 for(const p of pairs){if(p.length!==2||p.some(i=>!byId.has(i)||!byId.get(i).available||used.has(i))||eligibility(byId.get(p[0]),byId.get(p[1])).status!=='feasible'||s.introductions.some(i=>pairKey(i.user_a,i.user_b)===pairKey(...p)))throw Error('Illegal or overlapping introduction');p.forEach(i=>used.add(i));}
 const ranked=graphEdges(state),edgeByPair=new Map(ranked.map((e,i)=>[pairKey(...e.pair),{...e,rank:i+1}]));
 for(const pair of pairs.map(p=>p.slice().sort()).sort((a,b)=>pairKey(...a)<pairKey(...b)?-1:1)){
  const[a,b]=pair.map(id=>s.members.find(m=>m.member_id===id)),r=random(hash(`${s.seed}|${a.member_id}|${b.member_id}|${s.day}`)),id=`i${s.introductions.length}_${s.day}`,shared=r.normal(.45),intro={introduction_id:id,user_a:a.member_id,user_b:b.member_id,assigned_day:s.day,response_deadline_day:s.day+7};const edge=edgeByPair.get(pairKey(...pair));intro.selection={selected_by:manual?'manual':'conservative',day:s.day,score:edge.score,agreements:edge.agreements,rank:edge.rank,candidate_count:ranked.length,profiles:pair.map(id=>{const m=byId.get(id);return{member_id:id,name:s.members.find(x=>x.member_id===id).name,age:m.age,gender:m.gender,zone:m.zone,fields:clone(m.fields),field_status:clone(m.field_status),field_observed_day:clone(m.field_observed_day)};})};s.introductions.push(intro);activity(s,'introduction',`${a.name} ↔ ${b.name}: introduction assigned`);
  const responses=[];for(const m of[a,b]){const responded=r()<m.response_rate;const weights=s.family==='shift'?{relationship_goal:.25,relationship_pace:.8,lifestyle:-.25,conversations:.5}:{relationship_goal:.7,relationship_pace:.4,lifestyle:.25,conversations:.2};const fit=Object.entries(weights).reduce((n,[k,w])=>n+w*(a.truth[k]===b.truth[k]?1:-.5),0),yes=r()<sigmoid(-.25+m.bias+fit+shared+(s.family==='drift'&&s.day>=35?-.5:0)),delay=r.int(1,7);responses.push({responded,yes,day:s.day+delay});emit(s,{introduction_id:id,member_id:m.member_id,event:'introduction_response',value:responded?(yes?'yes':'no'):null,occurred_day:responded?s.day+delay:null,observed_day:responded?s.day+delay:s.day+7});}
  a.busy_until=b.busy_until=s.day+8;
  if(responses.every(x=>x.responded&&x.yes)){
   const dateDay=Math.max(...responses.map(x=>x.day))+r.int(1,14)+(s.family==='delayed'?r.int(5,12):0),happened=r()<.78;emit(s,{introduction_id:id,member_id:null,event:'date_happened',value:happened,occurred_day:dateDay,observed_day:dateDay});a.busy_until=b.busy_until=dateDay+6;
   if(happened){const seconds=[];for(const m of[a,b]){const answered=r()<m.response_rate,delay=r.int(1,5),yes=r()<sigmoid(.15+m.second_bias+shared+.4*(a.truth.relationship_goal===b.truth.relationship_goal));seconds.push({yes:answered&&yes,day:answered?dateDay+delay:dateDay+5});emit(s,{introduction_id:id,member_id:m.member_id,event:'second_meeting_intention',value:answered?(yes?'yes':'no'):null,occurred_day:answered?dateDay+delay:null,observed_day:answered?dateDay+delay:dateDay+5});}if(seconds.every(x=>x.yes))emit(s,{introduction_id:id,member_id:null,members:[a.member_id,b.member_id],event:'pause_after_mutual_interest',value:true,occurred_day:Math.max(...seconds.map(x=>x.day)),observed_day:Math.max(...seconds.map(x=>x.day))});}
  }
 }
}
export function step(s,selectedPairs=null){
 if(s.day>=100)throw Error('Session has finished');const before=observe(s),t=performance.now();let asks=[],pairs=[];
 if(s.day<60){asks=clarify(s);const refreshed=observe(s);pairs=selectedPairs??choosePairs(refreshed);introduce(s,pairs,selectedPairs!==null);}
 s.last_decision={day:s.day,asks:asks.length,pairs:pairs.length,question_cost:asks.length*3,elapsed_ms:performance.now()-t,policy:selectedPairs?'manual operator selection':VERSION};s.day++;s.ask_spent=0;
 for(const m of s.members)if(m.arrived_day===s.day)activity(s,'arrival',`${m.name}: joined the available pool`);
 const newEvents=visibleEvents(s).filter(e=>e.observed_day>before.day);for(const e of newEvents){const m=s.members.find(m=>m.member_id===e.member_id);const intro=s.introductions.find(i=>i.introduction_id===e.introduction_id);const names=intro?[intro.user_a,intro.user_b].map(id=>s.members.find(m=>m.member_id===id).name).join(' & '):'';const text=e.event==='introduction_response'?`${m?.name}: ${e.value===null?'no introduction reply':`introduction ${e.value}`}`:e.event==='date_happened'?`${names}: ${e.value?'first date completed':'date did not happen'}`:e.event==='second_meeting_intention'?`${m?.name}: ${e.value===null?'second-date feedback missing':`second-date ${e.value}`}`:`${names}: mutual interest recorded`;activity(s,e.event,text);}
 return s;
}
export function pairResults(s){
 const names=new Map((s.members||[]).map(m=>[m.member_id,m.name])),events=new Map();
 for(const e of visibleEvents(s)){if(!events.has(e.introduction_id))events.set(e.introduction_id,[]);events.get(e.introduction_id).push(e);}
 return s.introductions.map(i=>{
  const es=events.get(i.introduction_id)||[],rs=es.filter(e=>e.event==='introduction_response'),dateEvent=es.find(e=>e.event==='date_happened'),date=dateEvent?.value===true?dateEvent:null,ss=es.filter(e=>e.event==='second_meeting_intention');
  const mutual=rs.length===2&&rs.every(e=>e.value==='yes'),bothYes=!!date&&ss.length===2&&ss.every(e=>e.value==='yes'),qualifyingDate=!!date&&date.occurred_day-i.assigned_day<=30,eventual=bothYes&&qualifyingDate,timely=eventual&&ss.every(e=>e.occurred_day-date.occurred_day<=3);
  let status='pending',stage='Awaiting replies';
  if(rs.some(e=>e.value==='no')){status='no_mutual_acceptance';stage='Introduction declined';}
  else if(rs.some(e=>e.value===null)){status='missing_intro_feedback';stage='Introduction feedback missing';}
  else if(mutual){stage='Accepted · awaiting date';if(dateEvent?.value===false){status='no_date';stage='Date did not happen';}}
  if(date){stage='First date · awaiting feedback';if(ss.some(e=>e.value==='no')){status='no_mutual_second_yes';stage='No mutual second-date Yes';}else if(ss.some(e=>e.value===null)){status='missing_second_feedback';stage='Second-date feedback missing';}}
  if(bothYes){status=timely?'timely':qualifyingDate?'late_feedback':'date_outside_window';stage=timely?'Timely mutual Yes':qualifyingDate?'Mutual Yes · late feedback':'Mutual Yes · date outside 30 days';}
  if(status==='pending'&&s.day>=100){status='unresolved';stage='No complete outcome recorded';}
  const replies=id=>{const intro=rs.find(e=>e.member_id===id),second=ss.find(e=>e.member_id===id);return{member_id:id,name:names.get(id),introduction: intro?{value:intro.value,day:intro.occurred_day}:null,second:second?{value:second.value,day:second.occurred_day,delay:date&&second.occurred_day!=null?second.occurred_day-date.occurred_day:null}:null};};
  return{...i,names:[names.get(i.user_a),names.get(i.user_b)],status,stage,mutual_acceptance:mutual,date_happened:!!date,date_day:date?.occurred_day??null,qualifying_date:qualifyingDate,both_second_yes:bothYes,eventual_mutual_yes:eventual,timely_success:timely,replies:[replies(i.user_a),replies(i.user_b)]};
 });
}
export function metrics(s,results=pairResults(s)){const feedback=visibleEvents(s);return{introductions:results.length,mutual_acceptances:results.filter(r=>r.mutual_acceptance).length,dates:results.filter(r=>r.date_happened).length,official_couples:results.filter(r=>r.timely_success).length,eventual_mutual_yes:results.filter(r=>r.eventual_mutual_yes).length,missing_feedback:feedback.filter(e=>e.value===null&&['introduction_response','second_meeting_intention'].includes(e.event)).length,question_cost:s.asks_total};}
export function snapshot(s){
 const state=observe(s),names=new Map(s.members.map(m=>[m.member_id,m.name])),results=pairResults(s);
 const edges=s.day<60?graphEdges(state):[],pairs=s.day<60?choosePairs(state):[],eligible=new Set(pairs.map(p=>pairKey(...p)));
 return{engine:VERSION,scope:'Live synthetic JS simulation; not an official Python benchmark',day:s.day,phase:s.day>=100?'finished':s.day>=60?'follow-up':'active',seed:s.seed,pool:s.pool,family:s.family,question_budget_remaining:state.ask_budget_remaining,metrics:metrics(s,results),last_decision:s.last_decision,
  members:state.members.map(m=>({...m,name:names.get(m.member_id),known:HARD.every(k=>m.fields[k]!=null),declined:HARD.some(k=>m.field_status[k]==='declined')})),
  edges:edges.slice(0,800).map(e=>({...e,suggested:eligible.has(pairKey(...e.pair))})),edge_count:edges.length,suggested_pairs:pairs,
  introductions:results.slice(-100).reverse(),pair_results:results.slice().reverse(),activity:s.activity.slice(-80).reverse(),
  visible_feedback:visibleEvents(s).slice(-100).map(({members,...e})=>e),next_asks:s.day<60?chooseAsks(state):[],arrived_members:state.members.length,total_members:s.members.length};
}
