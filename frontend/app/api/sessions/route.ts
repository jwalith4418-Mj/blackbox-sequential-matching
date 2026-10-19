import {failure,json,listSessions,owner} from '../../../lib/session-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{return json({sessions:await listSessions(owner(request))});}catch(e){return failure(e);}}
