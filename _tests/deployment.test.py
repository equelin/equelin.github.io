#!/usr/bin/env python3
"""Verify migration deployment ordering without network access or credentials."""
import io
import json
from pathlib import Path
import runpy
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parent.parent / 'scripts/wait-for-legacy-pages.py'

def run(responses):
    def response(request, **kwargs):
        return io.BytesIO(json.dumps(next(responses)).encode())
    with patch.dict('os.environ', GITHUB_REPOSITORY='example/site', GITHUB_SHA='abc', GH_TOKEN='test'), \
         patch('urllib.request.urlopen', side_effect=response) as requests, \
         patch('time.sleep') as sleep:
        runpy.run_path(str(SCRIPT))
        return requests.call_count, sleep.call_count

assert run(iter([{'build_type': 'workflow'}])) == (1, 0)
assert run(iter([
    {'build_type': 'legacy'},
    {'workflow_runs': [{'name': 'pages build and deployment', 'status': 'in_progress'}]},
    {'workflow_runs': [{'name': 'pages build and deployment', 'status': 'completed'}]},
])) == (3, 1)
assert run(iter([{'build_type': 'legacy'}] + [{'workflow_runs': []}] * 6)) == (7, 5)
print('PASS: Actions source skips waiting; legacy deployments finish before Hugo publishes.')
