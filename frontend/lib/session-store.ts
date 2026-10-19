import { env } from '../server/storage.mjs';
import { createSession, snapshot, step, clarify } from './engine.mjs';
import fixtures from './fixture.json';
import {explainPair} from './pair-explanation.mjs';

export class ApiError extends Error { constructor(public status:number,message:string){super(message);} }
function db(){if(!env.DB)throw new ApiError(503,'Session storage is unavailable.');return env.DB;}
export function owner(request:Request){const id=request.headers.get('oai-authenticated-user-id');if(!id)throw new ApiError(401,'Sign in to open your live workspace.');return id;}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new ApiError(403,'Cross-origin writes are not allowed.');}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function body(request:Request){
 const declared=Number(request.headers.get('content-length')||0);if(declared>16384)throw new ApiError(413,'Request is too large.');
 const reader=request.body?.getReader();if(!reader)throw new ApiError(400,'A JSON request is required.');let size=0;const chunks=[];while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();throw new ApiError(413,'Request is too large.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.byteLength;}
 try{const data=JSON.parse(new TextDecoder().decode(bytes));if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw new ApiError(400,'A valid JSON object is required.');}
}
type Row={id:string;owner_id:string;revision:number;state_json:string;last_request_id:string;updated_at:number};
function view(row:Row){return{session_id:row.id,revision:row.revision,updated_at:row.updated_at,...snapshot(JSON.parse(row.state_json))};}
export async function latest(ownerId:string){const row=await db().prepare('SELECT * FROM live_sessions WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 1').bind(ownerId).first<Row>();return row?view(row):null;}
export async function getSession(ownerId:string,id:string){const row=await db().prepare('SELECT * FROM live_sessions WHERE owner_id = ? AND id = ?').bind(ownerId,id).first<Row>();if(!row)throw new ApiError(404,'Session not found.');return view(row);}
export async function listSessions(ownerId:string){const result=await db().prepare("SELECT id, revision, updated_at, json_extract(state_json, '$.day') AS day, json_extract(state_json, '$.seed') AS seed, json_extract(state_json, '$.pool') AS pool, json_extract(state_json, '$.family') AS family FROM live_sessions WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 20").bind(ownerId).all();return result.results;}
export async function create(ownerId:string,input:any){
 if(typeof input.request_id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(input.request_id))throw new ApiError(400,'A unique request ID is required.');
 if(!['guided','seeded'].includes(input.pool)||!['development','sparse','cold_start','delayed','shift','drift'].includes(input.family)||!Number.isInteger(input.seed)||input.seed<0||input.seed>4294967295)throw new ApiError(400,'Select a valid pool, scenario and numeric seed.');
 const existing=await db().prepare('SELECT * FROM live_sessions WHERE id = ?').bind(input.request_id).first<Row>();if(existing){if(existing.owner_id!==ownerId)throw new ApiError(409,'Request ID is already in use.');return view(existing);}
 const state=createSession(input,fixtures),now=Date.now();await db().prepare('INSERT INTO live_sessions (id, owner_id, revision, last_request_id, state_json, updated_at) VALUES (?, ?, 0, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind(input.request_id,ownerId,input.request_id,JSON.stringify(state),now).run();
 const row=await db().prepare('SELECT * FROM live_sessions WHERE id = ? AND owner_id = ?').bind(input.request_id,ownerId).first<Row>();if(!row)throw new ApiError(409,'Session creation conflicted. Retry with a new request ID.');
 return view(row);
}
export async function mutate(ownerId:string,input:any){
 if(typeof input.session_id!=='string'||typeof input.request_id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(input.request_id)||!Number.isInteger(input.revision)||!['step','clarify'].includes(input.action))throw new ApiError(400,'Invalid session action.');
 const row=await db().prepare('SELECT * FROM live_sessions WHERE id = ? AND owner_id = ?').bind(input.session_id,ownerId).first<Row>();if(!row)throw new ApiError(404,'Session not found.');
 if(row.last_request_id===input.request_id)return view(row);
 if(row.revision!==input.revision)throw new ApiError(409,'This session changed in another tab. Reloading the latest state is required.');
 const state=JSON.parse(row.state_json);
 try{if(input.action==='clarify')clarify(state);else{if(input.pairs!=null&&(state.day>=60||!Array.isArray(input.pairs)||input.pairs.length>100||input.pairs.some((p:any)=>!Array.isArray(p)||p.length!==2||p.some((x:any)=>typeof x!=='string'))))throw Error('Invalid selected pairs');step(state,input.pairs??null);}}catch(e){throw new ApiError(400,e instanceof Error?e.message:'Invalid decision');}
 const result=await db().prepare('UPDATE live_sessions SET state_json = ?, revision = revision + 1, last_request_id = ?, updated_at = ? WHERE id = ? AND owner_id = ? AND revision = ?').bind(JSON.stringify(state),input.request_id,Date.now(),row.id,ownerId,row.revision).run();
 if(result.meta.changes!==1)throw new ApiError(409,'A concurrent update won. Refresh before continuing.');
 const updated=await db().prepare('SELECT * FROM live_sessions WHERE id = ? AND owner_id = ?').bind(row.id,ownerId).first<Row>();if(!updated)throw new ApiError(404,'Session no longer exists.');return view(updated);
}
export function failure(error:unknown){if(error instanceof ApiError)return json({error:error.message},error.status);console.error('Session request failed:',error instanceof Error?error.message:'unknown');return json({error:'The decision service could not complete this request. Please retry.'},503);}

export async function pairExplanation(ownerId:string,input:any){
 if(typeof input.session_id!=='string'||input.session_id.length>100||typeof input.revision!=='string'||!/^\d{1,9}$/.test(input.revision)||typeof input.a!=='string'||typeof input.b!=='string'||!/^live_\d{3}$/.test(input.a)||!/^live_\d{3}$/.test(input.b)||input.a===input.b)throw new ApiError(400,'Choose two different arrived members from a saved session.');
 const row=await db().prepare('SELECT * FROM live_sessions WHERE id = ? AND owner_id = ?').bind(input.session_id,ownerId).first<Row>();
 if(!row)throw new ApiError(404,'Session not found.');
 if(row.revision!==Number(input.revision))throw new ApiError(409,'The session changed. Sync it before reviewing this pair.');
 try{return {session_id:row.id,revision:row.revision,...explainPair(JSON.parse(row.state_json),input.a,input.b)};}catch{throw new ApiError(400,'Choose two different arrived members.');}
}
