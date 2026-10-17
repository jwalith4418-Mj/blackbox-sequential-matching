"""Verify and extract the single exact submission archive for CI."""
import argparse,hashlib,json,os,stat
from pathlib import Path,PurePosixPath
from zipfile import ZipFile

EXPECTED_SHA256='c03ae58397104e276a67d7d343e8be4635a499352111c24e1e774d0ea9dee936'

def main():
 p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,default=Path('Blackbox_Submission.zip'));p.add_argument('--destination',type=Path,required=True);p.add_argument('--receipt',type=Path,required=True);a=p.parse_args()
 if a.destination.exists():raise ValueError('choose a new extraction directory')
 digest=hashlib.sha256(a.archive.read_bytes()).hexdigest();sidecar=a.archive.with_suffix('.zip.sha256').read_text().split()
 if digest!=EXPECTED_SHA256:raise ValueError('archive differs from the frozen published submission')
 if len(sidecar)!=2 or sidecar[0]!=digest or sidecar[1]!=a.archive.name:raise ValueError('archive checksum mismatch')
 with ZipFile(a.archive) as z:
  entries=z.infolist();names=[i.filename for i in entries]
  if len(names)>10000 or sum(i.file_size for i in entries)>512*1024**2:raise ValueError('archive size bound')
  if len(names)!=len(set(n.casefold() for n in names)):raise ValueError('duplicate or Windows-colliding archive paths')
  for info in entries:
   n=info.filename;path=PurePosixPath(n)
   if path.is_absolute() or '..' in path.parts or '\\' in n or ':' in n or not n.startswith('Blackbox_Round2_Submission/'):raise ValueError('archive path')
   if n.lower().endswith(('.zip','.rar','.7z','.tar','.tgz')):raise ValueError('nested archive')
   if stat.S_ISLNK(info.external_attr>>16):raise ValueError('archive symlink')
  if z.testzip() is not None:raise ValueError('archive CRC')
  z.extractall(a.destination)
 root=(a.destination/'Blackbox_Round2_Submission').resolve();a.receipt.parent.mkdir(parents=True,exist_ok=True)
 a.receipt.write_text(json.dumps({'archive_sha256':digest,'files':len(names),'nested_archives':0,'zip_crc_passed':True,'project_root':str(root),'github_commit':os.environ.get('GITHUB_SHA'),'github_run_id':os.environ.get('GITHUB_RUN_ID')},indent=2)+'\n')
 if os.environ.get('GITHUB_OUTPUT'):
  with open(os.environ['GITHUB_OUTPUT'],'a',encoding='utf-8') as f:f.write('project_root='+str(root)+'\n')
 print(json.dumps({'passed':True,'archive_sha256':digest,'files':len(names)}));return 0

if __name__=='__main__':raise SystemExit(main())
