"""Project the original confirmation's aggregate episode records into a read-only casebook."""
import argparse,collections,csv,hashlib,io,json
from pathlib import Path

def build(source_bytes):
 data=json.loads(source_bytes)
 assert data['complete'] and data['all_valid'] and len(data['episodes'])==480
 fields=['seed','variant','method','valid','arrived_members','assignments','mutual_acceptances','dates','mutual_second_meeting_intention','auxiliary_recorded_mutual_yes','msmi_per_100_arrived_members','served_members','unserved_members','ask_cost','missing_feedback','action_sha256']
 rows=[]
 for e in data['episodes']:
  assert e['valid'] and e['method'] in ['conservative','coordinated']
  assert e['auxiliary_recorded_mutual_yes']>=e['mutual_second_meeting_intention']>=0
  category='official_success' if e['mutual_second_meeting_intention']>0 else 'mutual_yes_but_late' if e['auxiliary_recorded_mutual_yes']>0 else 'date_without_qualifying_recorded_mutual_yes' if e['dates']>0 else 'no_completed_date'
  rows.append(dict(case_id=f"confirmation-{e['seed']}-{e['variant']}-{e['method']}",category=category,**{k:e[k] for k in fields}))
 rows.sort(key=lambda r:(r['seed'],r['variant'],r['method']))
 assert len({r['case_id'] for r in rows})==480
 totals=dict(collections.Counter(r['category'] for r in rows))
 assert totals=={'official_success':242,'mutual_yes_but_late':153,'date_without_qualifying_recorded_mutual_yes':78,'no_completed_date':7}
 return dict(schema_version=1,study_id='original_coordinated_confirmation',title='Original coordinated-controller confirmation',scope='Recorded native Linux CPU synthetic-kit evaluation; not live pool results. Both policies on 240 paired worlds, not 480 independent worlds.',source=dict(path='results/coordinated/confirmation.json',sha256=hashlib.sha256(source_bytes).hexdigest(),plan_sha256=data['confirmation_plan_sha256'],source_and_assets_sha256=data['source_and_assets_sha256']),seeds=data['config']['seeds'],methods=data['config']['methods'],families=data['config']['variants'],totals=dict(runs=480,successful_runs=242,zero_score_runs=238,official_couples=sum(r['mutual_second_meeting_intention'] for r in rows),categories=totals),classification='Ordered episode outcome partition: official MSMI > 0; else auxiliary qualifying-date mutual Yes > 0; else completed dates > 0; else no completed date. This is observed outcome classification, not proof of a unique causal failure.',record_detail='Aggregate episode records. Individual pair identities, reply timestamps and pair-level causal reasons are not retained in this casebook. Missing feedback is not a No label.',rows=rows)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);parser.add_argument('--output',type=Path,default=Path('public/data/confirmation-cases.json'));args=parser.parse_args()
 result=build(args.source.read_bytes());args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2)+'\n')
 fields=list(result['rows'][0]);output=io.StringIO(newline='');writer=csv.DictWriter(output,fieldnames=fields);writer.writeheader();writer.writerows(result['rows']);args.output.with_suffix('.csv').write_text(output.getvalue(),newline='')
 print(json.dumps({'passed':True,'rows':len(result['rows']),'totals':result['totals'],'source_sha256':result['source']['sha256']}))
if __name__=='__main__':main()
