import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HARD,SOFT,observe,graphEdges,choosePairs,createSession,step,snapshot} from '../lib/engine.mjs';
import {explainPair} from '../lib/pair-explanation.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const fields={age_min:18,age_max:65,who_to_meet:['man','woman','non_binary'],relationship_structure:'monogamous',smoking:'no',partner_smoking:'any',has_children:false,partner_children:'any',wants_children:'unsure',acceptable_zones:['zone_a'],schedule:['weekday_evening'],...Object.fromEntries(SOFT.map(k=>[k,'shared']))};
function world(){return{day:0,seed:12,family:'development',ask_spent:0,asks_total:0,events:[],introductions:[],ask_log:[],activity:[],members:Array.from({length:4},(_,i)=>({member_id:`live_00${i}`,pool_id:'live',name:`Member 00${i+1}`,age:30,gender:'man',zone:'zone_a',arrived_day:0,exit_day:10000,busy_until:0,fields:clone(fields),field_status:Object.fromEntries([...HARD,...SOFT].map(k=>[k,'observed'])),field_observed_day:Object.fromEntries([...HARD,...SOFT].map(k=>[k,0])),truth:{secret:'never expose'},bias:999,second_bias:999,response_rate:.5}))};}
let s=world(),before=clone(s),x=explainPair(s,'live_000','live_001');
assert.equal(x.status,'selected');assert.equal(x.can_introduce,true);assert.equal(x.score,7);assert(x.hard_checks.every(c=>c.status==='pass'));assert.equal(x.attributes.length,18);assert.deepEqual(s,before);
x=explainPair(s,'live_000','live_002');assert.equal(x.status,'not_selected');assert.equal(x.can_introduce,true);assert(x.blockers.some(b=>b.same_score&&b.pair.includes('live_001')));
s.members[2].fields.relationship_goal='different';x=explainPair(s,'live_000','live_002');assert.equal(x.score,6);assert(x.blockers.some(b=>!b.same_score&&b.score===7));
s=world();s.members[0].fields.age_max=25;x=explainPair(s,'live_000','live_001');assert.equal(x.status,'blocked');assert(x.hard_checks.some(c=>c.id==='live_000:age'&&c.status==='fail'));
s=world();s.members[0].fields.has_children=true;s.members[1].fields.partner_children='no_children';x=explainPair(s,'live_000','live_001');assert(x.hard_checks.some(c=>c.id==='live_001:children_present'&&c.status==='fail'));assert.equal(x.can_introduce,false);
for(const field of HARD){s=world();s.members[0].fields[field]=null;s.members[0].field_status[field]='declined';x=explainPair(s,'live_000','live_001');assert.equal(x.status,'blocked');assert(x.missing.some(r=>r.field===field));assert.equal(x.attributes.find(r=>r.field===field).left.status,'declined');}
s=world();s.members[0].fields.relationship_goal=null;x=explainPair(s,'live_000','live_001');assert.equal(x.score,6);assert.equal(x.soft[0].status,'unknown');assert.equal(x.soft[0].points,0);
s=world();s.members[0].busy_until=5;x=explainPair(s,'live_000','live_001');assert(x.reasons.some(r=>r.code==='unavailable'));assert.equal(x.can_introduce,false);
s=world();s.introductions=[{introduction_id:'past',user_a:'live_000',user_b:'live_001',assigned_day:0}];x=explainPair(s,'live_000','live_001');assert(x.reasons.some(r=>r.code==='previous_introduction'));assert.equal(x.previous_introduction.selection,null);
s=world();s.day=60;x=explainPair(s,'live_000','live_001');assert(x.reasons.some(r=>r.code==='horizon'));assert.equal(x.selected,false);assert.equal(x.can_introduce,false);
s=world();s.members[1].arrived_day=10;assert.throws(()=>explainPair(s,'live_000','live_001'),/arrived/);assert.throws(()=>explainPair(s,'live_000','live_000'),/different/);
s=world();s.events=[{event:'secret_future_feedback',value:'private',observed_day:900}];x=explainPair(s,'live_000','live_001');assert(!/"(truth|bias|second_bias|response_rate|busy_until|exit_day)":|secret_future_feedback|never expose/.test(JSON.stringify(x)));
// Differential coverage: explanations must agree with actual plans on fresh worlds.
const fixture=JSON.parse(fs.readFileSync('lib/fixture.json'));let checked=0;
for(const family of ['development','sparse','cold_start','delayed','shift','drift']){
 const game=createSession({pool:'seeded',family,seed:2026},fixture),state=observe(game),edges=graphEdges(state),plan=choosePairs(state).map(p=>p.join('|'));
 const samples=[...edges.slice(0,5).map(e=>e.pair),...state.members.slice(1,6).map(m=>[state.members[0].member_id,m.member_id])];
 for(const p of samples){const r=explainPair(game,...p);assert.equal(r.selected,plan.includes(p.slice().sort().join('|')));if(r.can_introduce)assert(edges.some(e=>e.pair.join('|')===p.slice().sort().join('|')));assert.equal(r.score,r.soft.reduce((n,e)=>n+e.points,0));checked++;}
}
const game=createSession({pool:'guided',family:'development',seed:2026},fixture);step(game);assert(game.introductions.length>0);for(const i of game.introductions){assert.equal(i.selection.selected_by,'conservative');assert.equal(i.selection.score,i.selection.agreements.length);}assert(snapshot(game).pair_results.every(r=>r.selection));
const receipt={passed:true,scope:'Observed-state explanation logic, independent scenarios and comparison with actual conservative plans',checks:['selected and skipped pairs','higher-score and exact-tie blockers','directional hard failures','all 11 missing or declined hard attributes','unknown soft fields add zero','unavailable and repeated pairs','ended horizon','unarrived and identical members rejected','no hidden or future fields','read-only explanations','decision-time rationale saved for new introductions'],sampled_pair_comparisons:checked};
fs.writeFileSync('pair-explanation-validation.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
