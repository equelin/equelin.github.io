#!/usr/bin/env python3
"""Avoid a race with GitHub's legacy branch-based Pages publisher during migration."""
import json
import os
import time
from urllib.request import Request, urlopen

api = f'https://api.github.com/repos/{os.environ["GITHUB_REPOSITORY"]}'
sha = os.environ['GITHUB_SHA']
token = os.environ['GH_TOKEN']

def get(path):
    request = Request(api + path, headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    })
    with urlopen(request, timeout=30) as response:
        return json.load(response)

if get('/pages').get('build_type') == 'workflow':
    print('Pages uses GitHub Actions; no legacy publisher to wait for.')
else:
    for attempt in range(60):
        runs = get(f'/actions/runs?head_sha={sha}&per_page=100')['workflow_runs']
        legacy = [run for run in runs if run['name'] == 'pages build and deployment']
        if legacy and all(run['status'] == 'completed' for run in legacy):
            print('Legacy Pages publisher finished; Hugo can safely deploy last.')
            break
        # workflow_dispatch can rebuild a commit that never had a legacy run.
        if not legacy and attempt >= 5:
            print('No legacy publisher found for this commit; proceeding.')
            break
        print('Waiting for the legacy Pages publisher...', flush=True)
        time.sleep(10)
    else:
        raise SystemExit('Legacy Pages publisher did not finish within ten minutes.')
