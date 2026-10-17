"""Write a source-host receipt only after the exact project's checks execute."""
import argparse,hashlib,json,os,platform,subprocess,sys
from datetime import datetime,timezone
from pathlib import Path

def main():
 p=argparse.ArgumentParser();p.add_argument('--project',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--require-windows',action='store_true');a=p.parse_args();root=a.project.resolve()
 if a.output.resolve()==root or root in a.output.resolve().parents:raise ValueError('receipt must be external')
 receipt={'validated_source_host':False,'actual_windows':platform.system()=='Windows','actual_docker':False,'platform':platform.platform(),'python':sys.version,'started_utc':datetime.now(timezone.utc).isoformat(),'github_commit':os.environ.get('GITHUB_SHA'),'github_run_id':os.environ.get('GITHUB_RUN_ID'),'proof_type':'Executed host checks; not an external cryptographic signature.'}
 a.output.parent.mkdir(parents=True,exist_ok=True)
 def save():a.output.write_text(json.dumps(receipt,indent=2,sort_keys=True)+'\n')
 save()
 if a.require_windows and not receipt['actual_windows']:receipt['error']='Native Windows required';save();return 2
 env=dict(os.environ,OPENBLAS_NUM_THREADS='1',OMP_NUM_THREADS='1',MKL_NUM_THREADS='1',PYTHONDONTWRITEBYTECODE='1')
 run=subprocess.run([sys.executable,'-B',str(root/'tools/check_release.py')],cwd=root,capture_output=True,text=True,env=env,timeout=600)
 a.output.with_suffix('.log').write_text(run.stdout+run.stderr)
 receipt.update(exit_code=run.returncode,validated_source_host=run.returncode==0,manifest_sha256=hashlib.sha256((root/'SUBMISSION_MANIFEST.json').read_bytes()).hexdigest());save()
 return run.returncode

if __name__=='__main__':raise SystemExit(main())
