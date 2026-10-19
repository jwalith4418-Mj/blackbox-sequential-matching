"""Recover pair observations from unchanged retained episodes; never a new efficacy study.

Exports an episode only after its complete action digest and primary outcome counts
match the original confirmation. Uses observe() at assignment, never latent truth.
"""
import argparse,copy,hashlib,json,sys,time
from concurrent.futures import ProcessPoolExecutor,as_completed
from multiprocessing import get_context
from pathlib import Path

def replay(task):
 source,output,expected,source_sha=task
 root=Path(source);sys.path.insert(0,str(root/'research'));sys.path.insert(0,str(root));sys.path.insert(0,str(root/'research/starter'))
 from blackbox.registry import verified_episode_snapshot
 from blackbox.policy import decide as conservative
 from blackbox.labels import msmi_label,auxiliary_pair_label
 from coordinated.engine import decide as coordinated
 from kit import Simulator,generate,VERSION
 sim=Simulator(generate(expected['seed'],200,'evaluation',expected['variant']))
 names={m['member_id']:f"Profile {i+1:03d}" for i,m in enumerate(sim.world['members'])}
 saved={};trace=[];memory=None;choose=coordinated if expected['method']=='coordinated' else lambda request:conservative(request,'conservative')
 with verified_episode_snapshot():
  for day in range(60):
   for phase in ('ask','match'):
    state=sim.observe();response=choose({'schema_version':VERSION,'phase':phase,'state':state,'memory':memory});memory=response['memory'];actions=response['asks' if phase=='ask' else 'pairs'];trace.append([sim.day,phase,actions])
    if phase=='ask':sim.resolve_asks(actions)
    else:
     by_id={m['member_id']:m for m in state['members']}
     for pair in actions:
      saved[(tuple(sorted(pair)),sim.day)]=[{k:copy.deepcopy(by_id[i][k]) for k in ('member_id','age','gender','zone','fields','field_status','field_observed_day')}|{'name':names[i]} for i in pair]
     sim.advance(actions)
  for _ in range(40):sim.advance([])
 digest=hashlib.sha256(json.dumps(trace,sort_keys=True).encode()).hexdigest()
 if digest!=expected['action_sha256']:raise ValueError(f"Action digest mismatch: {expected['seed']} {expected['variant']} {expected['method']}")
 metrics=sim.metrics()
 for key in ('assignments','dates','mutual_acceptances','mutual_second_meeting_intention','ask_cost'):
  if metrics[key]!=expected[key]:raise ValueError('Outcome mismatch: '+key)
 feedback=sim.receive_feedback();pairs=[]
 for intro in sim.introductions:
  es=[e for e in feedback if e['introduction_id']==intro['introduction_id']];rs=[e for e in es if e['event']=='introduction_response'];date_event=next((e for e in es if e['event']=='date_happened'),None);date=date_event if date_event and date_event['value'] is True else None;ss=[e for e in es if e['event']=='second_meeting_intention']
  official=bool(msmi_label(intro,feedback,sim.day));eventual=bool(auxiliary_pair_label(intro,feedback,sim.day));both_yes=bool(date and len(ss)==2 and all(e['value']=='yes' for e in ss));mutual=len(rs)==2 and all(e['value']=='yes' for e in rs)
  status='unresolved';stage='No complete outcome recorded'
  if any(e['value']=='no' for e in rs):status='no_mutual_acceptance';stage='Introduction declined'
  elif any(e['value'] is None for e in rs):status='missing_intro_feedback';stage='Introduction feedback missing'
  elif date_event and date_event['value'] is False:status='no_date';stage='Date did not happen'
  if date:
   if any(e['value']=='no' for e in ss):status='no_mutual_second_yes';stage='No mutual second-date Yes'
   elif any(e['value'] is None for e in ss):status='missing_second_feedback';stage='Second-date feedback missing'
  if both_yes:status='timely' if official else 'late_feedback' if eventual else 'date_outside_window';stage={'timely':'Timely mutual Yes','late_feedback':'Mutual Yes · late feedback','date_outside_window':'Mutual Yes · date outside 30 days'}[status]
  def replies(actor):
   first=next((e for e in rs if e['member_id']==actor),None);second=next((e for e in ss if e['member_id']==actor),None)
   return {'member_id':actor,'name':names[actor],'introduction':{'value':first['value'],'day':first['occurred_day']} if first else None,'second':{'value':second['value'],'day':second['occurred_day'],'delay':second['occurred_day']-date['occurred_day'] if date and second['occurred_day'] is not None else None} if second else None}
  profiles=saved[(tuple(sorted((intro['user_a'],intro['user_b']))),intro['assigned_day'])];profiles.sort(key=lambda m:[intro['user_a'],intro['user_b']].index(m['member_id']))
  pairs.append({**intro,'names':[names[intro['user_a']],names[intro['user_b']]],'status':status,'stage':stage,'mutual_acceptance':mutual,'date_happened':bool(date),'date_day':date['occurred_day'] if date else None,'both_second_yes':both_yes,'eventual_mutual_yes':eventual,'timely_success':official,'replies':[replies(intro['user_a']),replies(intro['user_b'])],'profiles':profiles})
 if sum(r['eventual_mutual_yes'] for r in pairs)!=expected['auxiliary_recorded_mutual_yes']:raise ValueError('Auxiliary outcome mismatch')
 case_id=f"confirmation-{expected['seed']}-{expected['variant']}-{expected['method']}"
 result={'schema_version':1,'case_id':case_id,'scope':'Deterministic reconstruction from retained source; action digest and outcome counts verified against the original run. Not an independent evaluation.','source_sha256':source_sha,'action_sha256':digest,'verified':True,'profile_scope':'Only observe() fields captured before each introduction. Profile numbers are display aliases for synthetic IDs.','pairs':pairs}
 target=Path(output)/(case_id+'.json');target.parent.mkdir(parents=True,exist_ok=True);temporary=target.with_suffix('.tmp');temporary.write_text(json.dumps(result,separators=(',',':')));temporary.replace(target)
 return case_id,len(pairs)

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--workers',type=int,default=6);p.add_argument('--limit',type=int);a=p.parse_args()
 path=a.source/'results/coordinated/confirmation.json';raw=path.read_bytes();data=json.loads(raw);source_sha=hashlib.sha256(raw).hexdigest();rows=data['episodes'];started=time.monotonic()
 if a.limit:rows=rows[:a.limit]
 tasks=[];done=0
 for r in rows:
  case_id=f"confirmation-{r['seed']}-{r['variant']}-{r['method']}";target=a.output/(case_id+'.json')
  if target.exists():
   try:old=json.loads(target.read_text())
   except (OSError,ValueError):old={}
   if old.get('verified') and old.get('action_sha256')==r['action_sha256'] and old.get('source_sha256')==source_sha:done+=1;continue
  tasks.append((str(a.source.resolve()),str(a.output.resolve()),r,source_sha))
 with ProcessPoolExecutor(max_workers=a.workers,mp_context=get_context('spawn')) as pool:
  for future in as_completed([pool.submit(replay,t) for t in tasks]):
   case_id,count=future.result();done+=1
   print(json.dumps({'completed':done,'expected':len(rows),'case_id':case_id,'pairs':count,'elapsed_seconds':round(time.monotonic()-started,1)}),flush=True)
 print(json.dumps({'passed':True,'completed':done,'expected':len(rows),'source_sha256':source_sha,'elapsed_seconds':round(time.monotonic()-started,1)}),flush=True)
 return 0

if __name__=='__main__':raise SystemExit(main())
