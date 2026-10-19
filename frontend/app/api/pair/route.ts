import {failure,json,owner,pairExplanation} from '../../../lib/session-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{
  const user=owner(request),p=new URL(request.url).searchParams;
  return json({explanation:await pairExplanation(user,{session_id:p.get('session_id'),revision:p.get('revision'),a:p.get('a'),b:p.get('b')})});
 }catch(e){return failure(e);}
}
