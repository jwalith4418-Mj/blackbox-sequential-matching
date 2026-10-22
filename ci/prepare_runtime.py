"""Make an audited scratch derivative; never rewrite the published archive.

The frozen archive includes one unreferenced temporary answer file that is
absent from its strict runtime inventory. Only that known byte-identical file
may be omitted. Code, models, donors and the runtime manifest stay unchanged.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

STRAY='runtime/artifacts/releases/2f58302651f1d80bb7990a78654d8598e014e7860bc29c365c195b9881dea7a9/.answers.json.Nsg6g9'
STRAY_SHA='d94058c3cb25364527ce87b41fa9ed28ad50d0a558aaad10342751b1c58184f3'

def sha(path):
 return hashlib.sha256(path.read_bytes()).hexdigest()

def inventory(root):
 files={}
 for path in root.rglob('*'):
  if path.is_symlink():raise ValueError('Source contains a symlink')
  if path.is_file() and '__pycache__' not in path.relative_to(root).parts:files[path.relative_to(root).as_posix()]=sha(path)
 return files

def prepare(source,destination,receipt):
 source=source.resolve();destination=destination.resolve();receipt=receipt.resolve()
 if destination.exists() or source==destination or source in destination.parents or destination in source.parents:raise ValueError('Choose a new external scratch directory')
 if source==receipt or source in receipt.parents or destination==receipt or destination in receipt.parents:raise ValueError('Receipt must be external to both trees')
 before=inventory(source);manifest=json.loads((source/'SUBMISSION_MANIFEST.json').read_text(encoding='utf-8'))
 if {k:v for k,v in before.items() if k!='SUBMISSION_MANIFEST.json'}!=manifest['files']:raise ValueError('Original source inventory mismatch')
 if before.get(STRAY)!=STRAY_SHA:raise ValueError('Known temporary file identity differs')
 runtime=json.loads((source/'runtime/RUNTIME_MANIFEST.json').read_text(encoding='utf-8'))['files']
 if STRAY.removeprefix('runtime/') in runtime:raise ValueError('Temporary file is unexpectedly a declared runtime input')
 shutil.copytree(source,destination,ignore=shutil.ignore_patterns('__pycache__'))
 victim=destination/STRAY
 if destination not in victim.resolve().parents or sha(victim)!=STRAY_SHA:raise ValueError('Scratch path/identity mismatch')
 victim.unlink()
 del manifest['files'][STRAY]
 (destination/'SUBMISSION_MANIFEST.json').write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n',encoding='utf-8',newline='\n')
 after=inventory(destination)
 expected={k:v for k,v in before.items() if k not in (STRAY,'SUBMISSION_MANIFEST.json')}
 if {k:v for k,v in after.items() if k!='SUBMISSION_MANIFEST.json'}!=expected:raise ValueError('Unexpected derivative content change')
 if inventory(source)!=before:raise ValueError('Original source changed')
 result={'passed':True,'scope':'Scratch runtime preparation, not an execution/efficacy receipt','removed_only':STRAY,'removed_sha256':STRAY_SHA,'original_manifest_sha256':before['SUBMISSION_MANIFEST.json'],'derivative_manifest_sha256':after['SUBMISSION_MANIFEST.json'],'code_model_donor_runtime_manifest_bytes_unchanged':True,'original_tree_unchanged':True,'source_files':len(before),'derivative_files':len(after)}
 receipt.parent.mkdir(parents=True,exist_ok=True);receipt.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n',encoding='utf-8')
 return result

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--project',type=Path,required=True);p.add_argument('--destination',type=Path,required=True);p.add_argument('--receipt',type=Path,required=True);a=p.parse_args()
 print(json.dumps(prepare(a.project,a.destination,a.receipt)))

if __name__=='__main__':main()
