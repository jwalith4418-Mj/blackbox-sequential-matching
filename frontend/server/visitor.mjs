import {randomBytes,createHash} from 'node:crypto';
export function withVisitor(handler){return async(request)=>{
 const match=(request.headers.get('cookie')||'').match(/(?:^|;\s*)__Host-blackbox-visitor=([A-Za-z0-9_-]{43})(?:;|$)/);
 const token=match?.[1]??randomBytes(32).toString('base64url');const headers=new Headers(request.headers);
 for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-'))headers.delete(key);
 headers.set('oai-authenticated-user-id','visitor_'+createHash('sha256').update(token).digest('hex'));
 const response=await handler(new Request(request,{headers}));const out=new Response(response.body,{status:response.status,headers:response.headers});
 out.headers.set('Cache-Control','no-store');out.headers.set('X-Content-Type-Options','nosniff');
 if(!match)out.headers.append('Set-Cookie',`__Host-blackbox-visitor=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);return out;
};}
export function methodNotAllowed(){return Response.json({error:'Method not allowed'},{status:405,headers:{Allow:'GET, POST','Cache-Control':'no-store'}});}
