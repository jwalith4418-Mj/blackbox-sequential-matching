"""Regression checks for the narrowly allowlisted inventory repair."""
import json
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile
from prepare_runtime import prepare,sha,STRAY

REPO=Path(__file__).resolve().parents[1]

class PreparationTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.base=Path(self.temp.name)
  with ZipFile(REPO/'Blackbox_Submission.zip') as archive:archive.extractall(self.base/'original')
  self.source=self.base/'original/Blackbox_Round2_Submission';self.destination=self.base/'derivative';self.receipt=self.base/'receipt.json'

 def test_only_known_temporary_file_is_removed(self):
  original=sha(self.source/'SUBMISSION_MANIFEST.json')
  result=prepare(self.source,self.destination,self.receipt)
  self.assertEqual(result['source_files'],641);self.assertEqual(result['derivative_files'],640)
  self.assertEqual(result['derivative_manifest_sha256'],'010a5ae23caaa9a1f47714159f1c00019cfb71201b52fd37516a65354377fb28')
  self.assertTrue((self.source/STRAY).exists());self.assertFalse((self.destination/STRAY).exists())
  self.assertEqual(sha(self.source/'SUBMISSION_MANIFEST.json'),original)
  for name in json.loads((self.source/'runtime/RUNTIME_MANIFEST.json').read_text(encoding='utf-8'))['files']:
   self.assertEqual(sha(self.source/'runtime'/name),sha(self.destination/'runtime'/name))

 def test_unknown_extra_file_is_rejected(self):
  (self.source/'runtime/unknown.txt').write_text('unexpected',encoding='utf-8')
  with self.assertRaisesRegex(ValueError,'Original source inventory mismatch'):prepare(self.source,self.destination,self.receipt)
  self.assertFalse(self.destination.exists())

 def test_changed_temporary_file_is_rejected(self):
  (self.source/STRAY).write_bytes(b'changed')
  with self.assertRaises(ValueError):prepare(self.source,self.destination,self.receipt)
  self.assertFalse(self.destination.exists())

 def test_existing_destination_is_not_overwritten(self):
  self.destination.mkdir();marker=self.destination/'keep.txt';marker.write_text('keep',encoding='utf-8')
  with self.assertRaises(ValueError):prepare(self.source,self.destination,self.receipt)
  self.assertEqual(marker.read_text(encoding='utf-8'),'keep')

 def test_source_and_receipt_paths_are_protected(self):
  with self.assertRaises(ValueError):prepare(self.source,self.source/'nested',self.receipt)
  with self.assertRaises(ValueError):prepare(self.source,self.destination,self.source/'receipt.json')
  self.assertFalse(self.destination.exists())

if __name__=='__main__':unittest.main()
