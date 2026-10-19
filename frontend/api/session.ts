import {GET,POST} from '../app/api/session/route';
import {withVisitor,methodNotAllowed} from '../server/visitor.mjs';
export default {fetch:withVisitor((r:Request)=>r.method==='GET'?GET(r):r.method==='POST'?POST(r):methodNotAllowed())};
