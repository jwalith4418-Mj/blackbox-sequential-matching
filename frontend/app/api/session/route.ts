import {body,create,failure,getSession,json,latest,mutate,owner,sameOrigin} from '../../../lib/session-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const id=new URL(request.url).searchParams.get('id'),user=owner(request);return json({session:id?await getSession(user,id):await latest(user)});}catch(e){return failure(e);}}
export async function POST(request:Request){try{sameOrigin(request);const id=owner(request),input=await body(request);return json({session:input.action==='create'?await create(id,input):await mutate(id,input)});}catch(e){return failure(e);}}
