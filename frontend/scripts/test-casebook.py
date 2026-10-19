"""Verify the complete original-confirmation casebook and its CSV projection."""
import argparse,collections,csv,hashlib,json,sys
sys.dont_write_bytecode=True
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path);args=parser.parse_args()
data=json.loads((root/'public/data/confirmation-cases.json').read_text());rows=data['rows'];assert len(rows)==480
assert len({r['case_id'] for r in rows})==480
counts=collections.Counter(r['category'] for r in rows);assert counts=={'official_success':242,'mutual_yes_but_late':153,'date_without_qualifying_recorded_mutual_yes':78,'no_completed_date':7}
assert len({(r['seed'],r['variant']) for r in rows})==240
for r in rows:
 assert r['valid'] and r['seed'] in range(5101,5141) and r['method'] in ['conservative','coordinated']
 assert r['served_members']+r['unserved_members']==r['arrived_members']==200
 expected='official_success' if r['mutual_second_meeting_intention']>0 else 'mutual_yes_but_late' if r['auxiliary_recorded_mutual_yes']>0 else 'date_without_qualifying_recorded_mutual_yes' if r['dates']>0 else 'no_completed_date'
 assert r['category']==expected
assert sum(r['mutual_second_meeting_intention'] for r in rows)==342
assert collections.Counter(r['method'] for r in rows if r['category']=='official_success')=={'conservative':117,'coordinated':125}
with (root/'public/data/confirmation-cases.csv').open(newline='') as f:
 csvrows=list(csv.DictReader(f));assert len(csvrows)==480
 for actual,expected in zip(csvrows,rows):
  assert set(actual)==set(expected)
  for key,value in expected.items():assert actual[key]==str(value),(expected['case_id'],key)
checks=['480 unique source-identified episodes','242 successful runs versus 238 zero-score runs','failure partitions reconcile to 153 / 78 / 7','240 paired worlds and two policies retained','342 couples distinct from 242 successful runs','all CSV fields match JSON','all classification labels follow observed aggregate metrics']
if args.source:
 spec=spec_from_file_location('casebuilder',root/'scripts/build-confirmation-cases.py');module=module_from_spec(spec);spec.loader.exec_module(module)
 raw=args.source.read_bytes();assert hashlib.sha256(raw).hexdigest()==data['source']['sha256'];assert module.build(raw)==data
 checks.append('every projected field verified against the original retained confirmation artifact')
receipt={'passed':True,'checks':checks,'scope':'Recorded research projection verification; no new benchmark evaluation or success-rate claim'}
(root/'casebook-validation.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
