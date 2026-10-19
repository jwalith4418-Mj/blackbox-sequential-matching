import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSession,observe,snapshot,step,clarify,eligibility,chooseAsks,choosePairs,metrics} from '../lib/engine.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('../lib/fixture.json',import.meta.url)));const families=['development','sparse','cold_start','delayed','shift','drift'];
let days=0,introductions=0,maxStepMs=0;
for(const pool of ['guided','seeded'])for(const family of families){
 const s=createSession({pool,family,seed:101},fixture),allPairs=new Set();
 for(let d=0;d<100;d++){
  const state=observe(s);assert.equal(state.day,d);assert(chooseAsks(state).length*3<=state.ask_budget_remaining);const used=new Set();for(const p of choosePairs(state)){assert(!p.some(i=>used.has(i)));p.forEach(i=>used.add(i));const a=state.members.find(m=>m.member_id===p[0]),b=state.members.find(m=>m.member_id===p[1]);assert.equal(eligibility(a,b).status,'feasible');}
  const prior=s.introductions.length,t=performance.now();step(s);maxStepMs=Math.max(maxStepMs,performance.now()-t);assert.equal(s.day,d+1);
  for(const i of s.introductions.slice(prior)){const k=[i.user_a,i.user_b].sort().join('|');assert(!allPairs.has(k));allPairs.add(k);assert(i.assigned_day<60);}
  const view=snapshot(s);assert(view.question_budget_remaining>=0&&view.question_budget_remaining<=12);assert(view.visible_feedback.every(e=>e.observed_day<=view.day));assert(view.metrics.official_couples<=view.metrics.eventual_mutual_yes);assert(!/"(truth|bias|second_bias|response_rate|exit_day|busy_until)":/.test(JSON.stringify(view)));days++;
 }
 const total=metrics(s);assert.equal(total.introductions,s.introductions.length);assert.equal(snapshot(s).phase,'finished');assert.throws(()=>step(s),/finished/);introductions+=total.introductions;
}
const a=createSession({pool:'guided',family:'development',seed:405},fixture),b=createSession({pool:'guided',family:'development',seed:405},fixture);
for(let i=0;i<20;i++){step(a);step(b)}assert.deepEqual(a.events,b.events);assert.deepEqual(a.introductions,b.introductions);
const c=createSession({pool:'guided',family:'development',seed:2},fixture);const declined=c.members.filter(m=>Object.values(m.field_status).includes('declined')).map(m=>m.member_id);clarify(c);assert(c.ask_spent<=12);for(const id of declined){const m=c.members.find(m=>m.member_id===id);for(const[k,status]of Object.entries(m.field_status))if(status==='declined')assert.equal(m.fields[k],null);}
const label={day:100,events:[{introduction_id:'x',event:'date_happened',value:true,occurred_day:10,observed_day:10},{introduction_id:'x',member_id:'a',event:'second_meeting_intention',value:'yes',occurred_day:14,observed_day:14},{introduction_id:'x',member_id:'b',event:'second_meeting_intention',value:'yes',occurred_day:12,observed_day:12}],introductions:[{introduction_id:'x',assigned_day:1}],asks_total:0};assert.equal(metrics(label).official_couples,0);assert.equal(metrics(label).eventual_mutual_yes,1);label.events[1].value=null;assert.equal(metrics(label).eventual_mutual_yes,0);assert.equal(metrics(label).missing_feedback,1);
const result={passed:true,sessions:12,days_checked:days,introductions_checked:introductions,max_step_ms:maxStepMs,checks:['legal non-overlapping pairs','no repeated introductions','question budget','100-day horizon','no future feedback or hidden fields in public snapshots','deterministic seeded JS outcomes','declines stay unknown','late Yes separate from timely label','missing feedback not rejection'],scope:'JS live prototype engine tests; not official benchmark efficacy'};fs.writeFileSync('engine-validation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
