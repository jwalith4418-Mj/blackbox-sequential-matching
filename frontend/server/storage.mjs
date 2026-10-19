import {createClient} from '@libsql/client';
let client,ready;
function database(){
 if(!client){const url=process.env.TURSO_DATABASE_URL;if(!url)throw Error('Configure TURSO_DATABASE_URL for saved sessions.');if(process.env.VERCEL&&!/^libsql:\/\/|^https:\/\//.test(url))throw Error('Production requires a durable remote database.');client=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});}return client;
}
async function initialized(){const db=database();if(!ready)ready=db.executeMultiple('CREATE TABLE IF NOT EXISTS live_sessions (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, state_json TEXT NOT NULL, last_request_id TEXT NOT NULL, updated_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS live_sessions_owner_updated ON live_sessions(owner_id,updated_at);').catch(e=>{ready=null;throw e;});await ready;return db;}
function prepare(sql,args=[]){const execute=async()=>{const db=await initialized();return db.execute({sql,args});};return{bind(...values){return prepare(sql,values);},async first(){return(await execute()).rows[0]??null;},async all(){return{results:(await execute()).rows};},async run(){return{success:true,meta:{changes:(await execute()).rowsAffected}};}};}
export const env={DB:{prepare}};
