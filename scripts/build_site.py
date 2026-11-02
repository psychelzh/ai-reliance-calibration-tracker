"""Build an allowlisted static site and a dated, public Issue snapshot."""
import argparse
import json
import os
from pathlib import Path
import shutil
from datetime import datetime, timezone
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]

def snapshot(repo):
    result = []
    page = 1
    while True:
        headers = {'Accept':'application/vnd.github+json','User-Agent':'research-progress-pages'}
        if os.environ.get('GITHUB_TOKEN'):
            headers['Authorization'] = 'Bearer ' + os.environ['GITHUB_TOKEN']
        req=Request(f'https://api.github.com/repos/{repo}/issues?state=all&labels=task&per_page=100&page={page}',headers=headers)
        with urlopen(req, timeout=30) as response:
            items=json.load(response)
        if not isinstance(items, list):
            raise ValueError('Expected an issue list')
        for item in items:
            if 'pull_request' in item:
                continue
            result.append({key:item.get(key) for key in ('number','title','body','state','state_reason','updated_at','closed_at')}
                          | {'labels':[label['name'] for label in item['labels']]})
        if len(items)<100:
            break
        page+=1
    return {'generatedAt':datetime.now(timezone.utc).isoformat(),'repo':repo,'issues':result}

def build(output, refresh=True):
    config=json.loads((ROOT/'data/project.json').read_text(encoding='utf-8'))
    output=Path(output).resolve()
    if output==ROOT or ROOT.is_relative_to(output):
        raise ValueError('Output must not contain source')
    output.mkdir(parents=True,exist_ok=True)
    shutil.copy2(ROOT/'index.html',output/'index.html')
    shutil.copytree(ROOT/'assets',output/'assets',dirs_exist_ok=True)
    (output/'data').mkdir(exist_ok=True)
    shutil.copy2(ROOT/'data/project.json',output/'data/project.json')
    if refresh:
        data=snapshot(config['repo'])
    else:
        data=json.loads((ROOT/'data/issues-snapshot.json').read_text(encoding='utf-8'))
    (output/'data/issues-snapshot.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (output/'.nojekyll').write_text('',encoding='utf-8')
    print(f'Built {len(data["issues"])} public tasks to {output}')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',required=True)
    parser.add_argument('--offline',action='store_true')
    args=parser.parse_args()
    build(args.output,refresh=not args.offline)
