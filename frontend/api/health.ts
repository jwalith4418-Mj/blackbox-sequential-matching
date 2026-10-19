import {env} from '../server/storage.mjs';
import {VERSION} from '../lib/engine.mjs';
export async function GET(){
  try{await env.DB.prepare('SELECT id FROM live_sessions LIMIT 1').first();return Response.json({ok:true,engine:VERSION,storage:'libSQL ready',scope:'Live synthetic simulation; official benchmark separate'},{headers:{'Cache-Control':'no-store'}});}
  catch{return Response.json({ok:false,error:'Saved-session database is not configured or unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export default {fetch:(request:Request)=>request.method==='GET'?GET():new Response(null,{status:405})};
