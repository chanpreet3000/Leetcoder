# python3 scripts/convert/write.py <file.java>: the file holds "//// <slug>" sections of Java code; each one replaces
# problems/<slug>.json (language -> java), creating it for a question that had no solution yet. Without javac this is the only gate: it rejects a section whose class or
# public method names differ from LeetCode's Java starter, or whose braces/parens/brackets do not balance.
import json, os, re, sys

d = os.environ.get('CONVERT_DIR', 'scripts/.work/convert')
secs = re.split(r'^//// ', open(sys.argv[1]).read(), flags=re.M)[1:]

def names(java):
    java = re.sub(r'/\*.*?\*/|//[^\n]*', '', java, flags=re.S)  # the starter's commented-out ListNode etc.
    cls = re.findall(r'\bclass\s+(\w+)', java)
    meth = re.findall(r'^\s*public\s+(?:static\s+)?[\w<>\[\],\s]+?\s+(\w+)\s*\(', java, flags=re.M)
    return cls, meth

ok = bad = 0
for sec in secs:
    slug, code = sec.split('\n', 1)
    slug, code = slug.strip(), code.strip() + '\n'
    cls, meth = names(json.load(open(f'{d}/meta/{slug}.json'))['java'])
    problems = [f'missing class {c}' for c in cls[:1] if not re.search(r'\bclass\s+' + c + r'\b', code)]
    problems += [f'missing method {m}' for m in meth if not re.search(r'\b' + m + r'\s*\(', code)]
    stripped = re.sub(r'"(\\.|[^"\\])*"|\'(\\.|[^\'\\])*\'|//[^\n]*|/\*.*?\*/', '', code, flags=re.S)
    problems += [f'unbalanced {o}{c}' for o, c in ('{}', '()', '[]') if stripped.count(o) != stripped.count(c)]
    if problems:
        print('REJECT', slug, '; '.join(problems))
        bad += 1
        continue
    p = f'problems/{slug}.json'
    raw = open(p).read() if os.path.exists(p) else '\n'
    data = json.loads(raw) if raw.strip() else {'problemName': slug}
    data['language'], data['code'] = 'java', code
    open(p, 'w').write(json.dumps(data, indent=4, ensure_ascii=False) + ('\n' if raw.endswith('\n') else ''))
    ok += 1
print(f'{ok} written, {bad} rejected')
