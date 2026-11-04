# python3 scripts/convert/pack.py [size]: split <dir>/convert.json into <dir>/packs/NNN.txt,
# each problem with LeetCode's Java signature and the existing source to port (or its statement when there is none).
import html, json, os, re, sys

def statement(content):
    text = re.sub(r'<sup>', '^', content or '')
    text = re.sub(r'<[^>]+>', '', text)
    return re.sub(r'\n\s*\n+', '\n', html.unescape(text)).strip()

d = os.environ.get('CONVERT_DIR', 'scripts/.work/convert')
size = int(sys.argv[1]) if len(sys.argv) > 1 else 25
conv = json.load(open(f'{d}/convert.json'))
os.makedirs(f'{d}/packs', exist_ok=True)
for b in range(0, len(conv), size):
    parts = []
    for s in conv[b:b + size]:
        m = json.load(open(f'{d}/meta/{s}.json'))
        head = f'#### {s}\n-- java signature --\n{m["java"].strip()}\n'
        if os.path.exists(f'problems/{s}.json'):
            src = json.load(open(f'problems/{s}.json'))
            parts.append(head + f'-- source ({src["language"]}) --\n{src["code"].strip()}\n')
        else:  # nothing to port: write it from the statement
            parts.append(head + f'-- statement (no existing solution) --\n{statement(m["content"])}\n')
    open(f'{d}/packs/{b // size:03d}.txt', 'w').write('\n'.join(parts))
print(len(range(0, len(conv), size)), 'packs in', f'{d}/packs')
