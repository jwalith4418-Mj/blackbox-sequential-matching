import fs from 'node:fs/promises';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const source='public/data/confirmation-details';
const manifest=JSON.parse(await fs.readFile(`${source}/manifest.json`,'utf8'));
await fs.rm('dist',{recursive:true,force:true});await fs.cp('public','dist',{recursive:true});
let count=0;
for(const entry of await fs.readdir(source)){
 if(!entry.endsWith('.json.gz.base64'))continue;
 const target=entry.slice(0,-10),bytes=gunzipSync(Buffer.from(await fs.readFile(path.join(source,entry),'utf8'),'base64'));
 const expected=manifest.files.find(f=>f.case_id===target.slice(0,-5));
 if(!expected||createHash('sha256').update(bytes).digest('hex')!==expected.sha256)throw Error(`Evidence hash mismatch: ${target}`);
 await fs.writeFile(path.join('dist/data/confirmation-details',target),bytes);await fs.writeFile(path.join(source,target),bytes);await fs.rm(path.join('dist/data/confirmation-details',entry));count++;
}
if(count!==480)throw Error(`Expected 480 evidence files; got ${count}`);
await fs.copyFile('app/shell.html','dist/index.html');console.log('Built Results, pair attributes and all 480 verified historical case files.');
