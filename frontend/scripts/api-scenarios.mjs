import assert from 'node:assert/strict';
import {GET,POST} from '../app/api/session/route.ts';
import {GET as list} from '../app/api/sessions/route.ts';
import {GET as pairReview} from '../app/api/pair/route.ts';
import {GET as health} from '../app/api/health/route.ts';
const headers=(user='test-user-a')=>({'Content-Type':'application/json','Origin':'https://test.local',...(user?{'oai-authenticated-user-id':user}:{})});
const request=(data,user='test-user-a',extra={})=>new Request('https://test.local/api/session',{method:'POST',headers:{...headers(user),...extra},body:JSON.stringify(data)});
const read=(id,user='test-user-a')=>GET(new Request('https://test.local/api/session'+(id?'?id='+id:''),{headers:headers(user)}));
export async function run(){
 assert.equal((await read(null,null)).status,401);assert.equal((await POST(request({action:'create'},'test-user-a',{Origin:'https://evil.local'}))).status,403);
 const create={action:'create',request_id:crypto.randomUUID(),pool:'guided',family:'development',seed:101};let response=await POST(request(create));assert.equal(response.status,200);let state=(await response.json()).session;assert.equal(state.day,0);assert.equal(state.revision,0);const id=state.session_id;
 const [a,b]=state.members.slice(0,2).map(m=>m.member_id);
 const review=(user='test-user-a',revision='0',left=a,right=b)=>pairReview(new Request(`https://test.local/api/pair?session_id=${id}&revision=${revision}&a=${left}&b=${right}`,{headers:headers(user)}));
 assert.equal((await review(null)).status,401);assert.equal((await review('test-user-b')).status,404);
 assert.equal((await review('test-user-a','1')).status,409);assert.equal((await review('test-user-a','0',a,a)).status,400);
 assert.equal((await review('test-user-a','0',a,'live_999')).status,400);
 const explained=await review();assert.equal(explained.status,200);assert.equal(explained.headers.get('Cache-Control'),'no-store');const explanation=(await explained.json()).explanation;assert.equal(explanation.revision,0);assert.equal(explanation.attributes.length,18);assert.equal(explanation.soft.length,7);
 const unchanged=(await (await read(id)).json()).session;assert.equal(unchanged.day,0);assert.equal(unchanged.revision,0);
 assert(!/"(truth|bias|second_bias|response_rate|exit_day|busy_until)":/.test(JSON.stringify(explanation)));

 assert.equal((await POST(request(create))).status,200);assert.equal((await read(id,'test-user-b')).status,404);
 const action={action:'step',session_id:id,revision:0,request_id:crypto.randomUUID()};response=await POST(request(action));assert.equal(response.status,200);state=(await response.json()).session;assert.equal(state.day,1);assert.equal(state.revision,1);
 response=await POST(request(action));assert.equal(response.status,200);assert.equal((await response.json()).session.revision,1);
 assert.equal((await POST(request({...action,request_id:crypto.randomUUID()}))).status,409);assert.equal((await POST(request({...action,revision:1,request_id:crypto.randomUUID()},'test-user-b'))).status,404);
 assert.equal((await POST(request({...action,revision:1,request_id:crypto.randomUUID(),pairs:[['live_000','live_000']]}))).status,400);state=(await (await read(id)).json()).session;assert.equal(state.revision,1);assert.equal(state.day,1);
 response=await POST(new Request('https://test.local/api/session',{method:'POST',headers:headers(),body:'{'}));assert.equal(response.status,400);
 response=await POST(new Request('https://test.local/api/session',{method:'POST',headers:headers(),body:'x'.repeat(16385)}));assert.equal(response.status,413);
 assert.equal((await POST(request({...create,request_id:crypto.randomUUID(),seed:-1}))).status,400);
 assert.equal((await health()).status,200);const sessions=(await (await list(new Request('https://test.local/api/sessions',{headers:headers()}))).json()).sessions;assert.equal(sessions.length,1);assert.equal(sessions[0].id,id);const other=(await (await list(new Request('https://test.local/api/sessions',{headers:headers('test-user-b')}))).json()).sessions;assert.equal(other.length,0);
 assert(!/"(truth|bias|second_bias|response_rate|exit_day|busy_until)":/.test(JSON.stringify(state)));
 return{passed:true,scope:'Actual route/store functions with in-memory SQLite D1 adapter; separate from deployed D1 verification',checks:['missing identity rejected','cross-origin writes rejected','create and restore','create idempotency','step persisted once','retry idempotency','stale revision conflict','cross-owner read and write rejected','invalid pair leaves stored revision unchanged','malformed and oversized requests rejected','invalid config rejected','owner-only session history','health SQL query','no hidden fields in API state','pair explanations require session ownership and matching revision','pair explanations reject invalid or unarrived members','pair review does not mutate day or revision','no hidden fields in pair explanations']};
}
