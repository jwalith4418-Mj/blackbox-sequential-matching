import {GET} from '../app/api/pair/route';
import {withVisitor,methodNotAllowed} from '../server/visitor.mjs';
export default {fetch:withVisitor((r:Request)=>r.method==='GET'?GET(r):methodNotAllowed())};
