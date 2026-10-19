"""Validate complete reconstructed pair evidence against the retained casebook."""
import hashlib,json
from pathlib import Path

def main():
 root=Path(__file__).resolve().parents[1];casebook=json.loads((root/'public/data/confirmation-cases.json').read_text());folder=root/'public/data/confirmation-details';total_pairs=successes=0;files=[]
 for row in casebook['rows']:
  path=folder/(row['case_id']+'.json');data=json.loads(path.read_text());pairs=data['pairs']
  assert data['case_id']==row['case_id'] and data['verified'] is True
  assert data['source_sha256']==casebook['source']['sha256'] and data['action_sha256']==row['action_sha256']
  assert len(pairs)==row['assignments']
  assert len({p['introduction_id'] for p in pairs})==len(pairs)
  assert sum(p['timely_success'] for p in pairs)==row['mutual_second_meeting_intention']
  assert sum(p['eventual_mutual_yes'] for p in pairs)==row['auxiliary_recorded_mutual_yes']
  assert sum(p['date_happened'] for p in pairs)==row['dates']
  assert sum(p['mutual_acceptance'] for p in pairs)==row['mutual_acceptances']
  for pair in pairs:
   assert len(pair['profiles'])==2
   assert [m['member_id'] for m in pair['profiles']]==[pair['user_a'],pair['user_b']]
   for m in pair['profiles']:
    assert set(m)=={'member_id','name','age','gender','zone','fields','field_status','field_observed_day'}
    assert set(m['fields'])=={'age_min','age_max','who_to_meet','relationship_structure','smoking','partner_smoking','has_children','partner_children','wants_children','acceptable_zones','schedule','relationship_goal','relationship_pace','lifestyle','conversations','emotional_availability','space_for_relationship','relocate'}
    for key,value in m['fields'].items():
     if value is not None:assert m['field_observed_day'][key] is not None and m['field_observed_day'][key]<=pair['assigned_day']
   assert all(e is None or e['day'] is None or e['day']<=100 for r in pair['replies'] for e in (r['introduction'],r['second']))
  total_pairs+=len(pairs);successes+=sum(p['timely_success'] for p in pairs);files.append({'case_id':row['case_id'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 assert successes==342 and len(files)==480
 receipt={'passed':True,'scope':'Reconstruction of the original 480 runs, not additional independent evaluation','usage':'evaluation_only_not_training','cases':480,'pairs':total_pairs,'official_couples':successes,'source_sha256':casebook['source']['sha256'],'checks':['every action digest matches original run','per-run counts match original casebook','all pair profiles observed by assignment day','no latent profile fields','complete success and failure coverage']}
 (root/'replayed-details-validation.json').write_text(json.dumps(receipt,indent=2));(folder/'manifest.json').write_text(json.dumps({'schema_version':1,**receipt,'files':files},separators=(',',':')))
 print(json.dumps(receipt))
 return 0

if __name__=='__main__':raise SystemExit(main())
