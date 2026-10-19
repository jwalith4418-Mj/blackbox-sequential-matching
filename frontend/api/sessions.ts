import {GET} from '../app/api/sessions/route';
import {withVisitor,methodNotAllowed} from '../server/visitor.mjs';
export default {fetch:withVisitor((r:Request)=>r.method==='GET'?GET(r):methodNotAllowed())};
