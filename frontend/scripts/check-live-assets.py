from html.parser import HTMLParser
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
class Check(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.assets=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='img' and a.get('src'):self.assets.append(a['src'])
  if tag=='script' and a.get('src'):self.assets.append(a['src'])
  if tag=='link' and a.get('rel')=='stylesheet':self.assets.append(a['href'])
p=Check();p.feed((root/'app/shell.html').read_text());assert len(p.ids)==len(set(p.ids))
for a in p.assets:
 if not a.startswith(('http','data:')):assert (root/'public'/a.lstrip('/')).is_file(),a
assert 'pitch-dialog' not in (root/'app/shell.html').read_text()
data=json.loads((root/'public/data/evidence.json').read_text());assert data['totals']=={'runs':552,'successful_games':278,'zero_games':274}
assert sum(v['successful_games'] for s in data['studies'] for v in s['data']['summaries'].values())==278
print(json.dumps({'passed':True,'unique_ids':len(p.ids),'assets':len(p.assets),'recorded_results_separate_and_reconciled':True,'pitch_interface_removed':True}))
