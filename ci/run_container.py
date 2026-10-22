"""Run the frozen evaluator against an explicitly prepared scratch derivative.

This CI wrapper keeps Linux container and native Windows evidence separate.
"""
import argparse
import datetime
import importlib.util
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import time
import uuid

sys.dont_write_bytecode=True



def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--project',type=Path,required=True,help='audited external runtime derivative')
    p.add_argument('--output',type=Path,required=True,help='external evidence directory')
    p.add_argument('--require-windows',action='store_true')
    p.add_argument('--minutes',type=float,default=120)
    a=p.parse_args()
    ROOT=a.project.resolve()
    sys.path.insert(0,str(ROOT/'tools'))
    from verify_submission import verify, sha
    out=a.output.resolve()
    if out==ROOT or ROOT in out.parents:p.error('output must be outside the frozen submission folder')
    if not 0<a.minutes<=120:p.error('choose a budget above zero and at most 120 minutes')
    if out.exists():p.error('choose a new evidence directory; prior receipts are never overwritten')
    out.mkdir(parents=True)
    run_id=uuid.uuid4().hex
    deadline=time.monotonic()+a.minutes*60
    receipt={'schema_version':1,'run_id':run_id,'started_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
             'platform':platform.platform(),'python':platform.python_version(),'submitted_mode':'conservative',
             'native_windows':platform.system()=='Windows','native_cli_passed':False,
             'constrained_docker_passed':False,'validated':False,'status':'running','episodes':[],
             'constraints':{'network':'none','cpus':2,'memory':'1g','memory_swap':'1g','pids':64,
                            'read_only':True,'user':'65534:65534','cap_drop':'ALL',
                            'no_new_privileges':True,'tmpfs':'64m','policy_timeout_seconds':10},
             'proof_type':'Actual local execution, content hashes and immutable image ID; no external signature.'}
    env=dict(os.environ)
    for key in ('PYTHONPATH','PYTHONHOME','PYTHONSTARTUP','BLACKBOX_POLICY_MODE'):env.pop(key,None)
    env.update(OPENBLAS_NUM_THREADS='1',OMP_NUM_THREADS='1')

    def save():
        receipt['elapsed_seconds']=a.minutes*60-(deadline-time.monotonic())
        tmp=out/'runtime_validation.tmp'
        tmp.write_text(json.dumps(receipt,indent=2,sort_keys=True)+'\n',encoding='utf-8')
        os.replace(tmp,out/'runtime_validation.json')

    def remaining(maximum=7200):
        value=min(maximum,deadline-time.monotonic())
        if value<=0:raise ValueError('global validation budget exhausted')
        return value

    def command(args,maximum=120,input=None):
        proc=subprocess.run(args,cwd=ROOT,env=env,input=input,capture_output=True,timeout=remaining(maximum))
        if proc.returncode:
            raise ValueError('command failed: '+str(args[:3])+': '+proc.stderr.decode(errors='replace')[-1500:])
        return proc.stdout

    try:
        receipt['subject']=verify()
        receipt['root_dockerfile_sha256']=sha((ROOT/'Dockerfile').read_bytes())
        if a.require_windows and not receipt['native_windows']:
            raise ValueError('native Windows required; this host is '+platform.system())
        native=command([sys.executable,'-S','-B',str(ROOT/'runtime/verify_runtime.py'),'--smoke'])
        receipt['native_smoke']=json.loads(native)
        # Check default selection as well as the verifier's explicit-mode cases.
        example=(ROOT/'runtime/examples/refreshed_match_request.json').read_bytes()
        response=command([sys.executable,'-S','-B',str(ROOT/'runtime/policy.py')],input=example)
        if json.loads(response)['memory']['mode']!='conservative':raise ValueError('native default mode mismatch')
        receipt['native_cli_passed']=True;save()
        if not shutil.which('docker'):
            receipt['status']='unverified'
            raise ValueError('Docker CLI unavailable; start Docker Desktop with Linux containers')
        info=json.loads(command(['docker','info','--format','{{json .}}'],30))
        if info.get('OSType')!='linux':raise ValueError('Linux container engine required')
        receipt['docker_engine']={k:info.get(k) for k in ('OSType','ServerVersion','NCPU','MemTotal')}
        command(['docker','pull','python:3.12.14-slim'],1800)
        base=json.loads(command(['docker','image','inspect','python:3.12.14-slim'],30))[0]
        digests=base.get('RepoDigests',[])
        if not digests or '@sha256:' not in digests[0]:raise ValueError('base image registry digest unavailable')
        receipt['base_registry_digest']=digests[0]
        tag='blackbox-round2:validation-'+run_id
        build=command(['docker','build','--build-arg','PYTHON_BASE='+digests[0],'-t',tag,'.'],3600)
        (out/'docker_build.log').write_bytes(build)
        image=json.loads(command(['docker','image','inspect',tag],30))[0]
        if image['Size']>2*1024**3:raise ValueError('image exceeds 2 GiB')
        config=image['Config']
        expected=['python','-B','/app/policy.py','--mode','conservative']
        if config.get('Entrypoint')!=expected or config.get('User')!='65534:65534':
            raise ValueError('built image entrypoint/user mismatch')
        image_env=dict(item.split('=',1) for item in config.get('Env',[]) if '=' in item)
        if image_env.get('BLACKBOX_POLICY_MODE')!='conservative':raise ValueError('image mode mismatch')
        receipt.update(image_id=image['Id'],image_size_bytes=image['Size'])
        # Load the unmodified organizer harness; private state remains host-side.
        sys.path.insert(0,str(ROOT/'research/starter'))
        spec=importlib.util.spec_from_file_location('official_submission_eval',ROOT/'research/starter/evaluate.py')
        official=importlib.util.module_from_spec(spec);spec.loader.exec_module(official)
        from kit import generate
        def isolated_command():
            cmd=official.docker_command(image['Id'])
            return cmd[:-1]+['--label','blackbox.submission_validation='+run_id,cmd[-1]]
        probe=isolated_command()
        probe=probe[:-1]+['--entrypoint','python',probe[-1],'-S','-B','/app/verify_runtime.py','--smoke']
        receipt['container_integrity_smoke']=json.loads(command(probe,60))
        original_invoke=official.invoke
        def bounded_invoke(cmd,request,timeout=10):
            return original_invoke(cmd,request,timeout=min(timeout,remaining(10)))
        official.invoke=bounded_invoke
        old=json.loads((ROOT/'research/results/subprocess.json').read_text())
        golden={r['variant']:r for r in old['episodes'] if r['method']=='conservative'}
        fields=('assignments','mutual_acceptances','dates','mutual_second_meeting_intention',
                'ask_cost','first_introduction_wait_days','served_members','unserved_members','coverage')
        for variant in ('development','sparse','cold_start','delayed','shift','drift'):
            remaining()
            row=official.episode(generate(101,200,'evaluation',variant),isolated_command())
            if not row.get('valid') or any(row[k]!=golden[variant][k] for k in fields):
                raise ValueError('container/recorded conservative mismatch: '+variant)
            row.update(seed=101,variant=variant,method='conservative',matches_recorded_host_metrics=True)
            receipt['episodes'].append(row);save()
            print(json.dumps({'completed_container_episodes':len(receipt['episodes']),'variant':variant}),flush=True)
        after=verify()
        if after!=receipt['subject']:raise ValueError('frozen submission changed during validation')
        receipt['constrained_docker_passed']=len(receipt['episodes'])==6
        receipt['validated']=receipt['native_cli_passed'] and receipt['constrained_docker_passed'] and (not a.require_windows or receipt['native_windows'])
        receipt['status']='completed' if receipt['validated'] else 'incomplete'
        receipt['scope']='Actual Linux container verification; native Windows evidence is a separate matrix job' if not receipt['native_windows'] else 'Native Windows and container checks on this host'
        save()
        return 0 if receipt['validated'] else 2
    except (OSError,ValueError,KeyError,TypeError,subprocess.SubprocessError) as error:
        receipt['error']=type(error).__name__+': '+str(error)
        if receipt['status']=='running':receipt['status']='failed'
        save();print(receipt['error'],file=sys.stderr);return 2
    finally:
        if shutil.which('docker'):
            try:
                ids=subprocess.check_output(['docker','ps','-aq','--filter','label=blackbox.submission_validation='+run_id],timeout=10).decode().split()
                if ids:subprocess.run(['docker','rm','-f',*ids],capture_output=True,timeout=15)
            except (OSError,subprocess.SubprocessError):pass


if __name__=='__main__':raise SystemExit(main())
