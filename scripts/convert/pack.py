# python3 scripts/convert/pack.py [size]: split <dir>/convert.json into <dir>/packs/NNN.txt,
# each problem with LeetCode's Java signature and the existing source to port.
import json, os, sys

d = os.environ.get('CONVERT_DIR', 'scripts/.work/convert')
size = int(sys.argv[1]) if len(sys.argv) > 1 else 25
conv = json.load(open(f'{d}/convert.json'))
os.makedirs(f'{d}/packs', exist_ok=True)
for b in range(0, len(conv), size):
    parts = []
    for s in conv[b:b + size]:
        m = json.load(open(f'{d}/meta/{s}.json'))
        src = json.load(open(f'problems/{s}.json'))
        parts.append(f'#### {s}\n-- java signature --\n{m["java"].strip()}\n-- source ({src["language"]}) --\n{src["code"].strip()}\n')
    open(f'{d}/packs/{b // size:03d}.txt', 'w').write('\n'.join(parts))
print(len(range(0, len(conv), size)), 'packs in', f'{d}/packs')
