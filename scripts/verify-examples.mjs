// node verify.mjs [slug ...] : run every (or the given) java solution against the LeetCode examples.
// Prints PASS/SOFT/FAIL/ERR/SKIP per problem; writes verify-results.json
import fs from 'fs';
import path from 'path';
import {spawn} from 'child_process';

const sp = (process.env.SP||'scripts/.work');
const only = process.argv.slice(2);
const work = sp + '/work';
fs.mkdirSync(work, {recursive: true});

const STUBS = {
  ListNode: 'class ListNode{int val;ListNode next;ListNode(){}ListNode(int v){val=v;}ListNode(int v,ListNode n){val=v;next=n;}}',
  TreeNode: 'class TreeNode{int val;TreeNode left,right;TreeNode(){}TreeNode(int v){val=v;}TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}',
  Node: 'class Node{public int val;public List<Node> neighbors,children;public Node left,right,next,random,prev,child;public Node(){}public Node(int v){val=v;}public Node(int v,List<Node> c){val=v;children=c;neighbors=c;}}',
};

const FMT = `
  static String fmt(Object o){
    if(o==null)return "null";
    if(o instanceof String)return "\\""+o+"\\"";
    if(o instanceof Character)return "\\""+o+"\\"";
    if(o instanceof Boolean||o instanceof Integer||o instanceof Long)return o.toString();
    if(o instanceof Double||o instanceof Float)return o.toString();
    if(o.getClass().isArray()){
      StringBuilder sb=new StringBuilder("[");
      int n=java.lang.reflect.Array.getLength(o);
      for(int i=0;i<n;i++){if(i>0)sb.append(",");sb.append(fmt(java.lang.reflect.Array.get(o,i)));}
      return sb.append("]").toString();
    }
    if(o instanceof java.util.Collection){
      StringBuilder sb=new StringBuilder("[");boolean f=true;
      for(Object x:(java.util.Collection<?>)o){if(!f)sb.append(",");f=false;sb.append(fmt(x));}
      return sb.append("]").toString();
    }
    return o.toString();
  }`;

// split a JSON-ish value list; returns top-level elements of an array literal
function splitTop(s) {
  const out = []; let depth = 0, cur = '', inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { cur += c; if (c === '\\') { cur += s[++i]; } else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; cur += c; continue; }
    if (c === '[') depth++;
    if (c === ']') depth--;
    if (c === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim() !== '') out.push(cur);
  return out;
}

function javaType(t) {
  const m = {'integer': 'int', 'long': 'long', 'double': 'double', 'boolean': 'boolean', 'string': 'String', 'character': 'char'};
  if (m[t]) return m[t];
  let mm = t.match(/^(.*)\[\]$/); if (mm) { const b = javaType(mm[1]); return b ? b + '[]' : null; }
  mm = t.match(/^list<(.*)>$/); if (mm) { const b = boxed(mm[1]); return b ? 'List<' + b + '>' : null; }
  return null;
}
function boxed(t) {
  const m = {'integer': 'Integer', 'long': 'Long', 'double': 'Double', 'boolean': 'Boolean', 'string': 'String', 'character': 'Character'};
  if (m[t]) return m[t];
  const mm = t.match(/^list<(.*)>$/); if (mm) { const b = boxed(mm[1]); return b ? 'List<' + b + '>' : null; }
  return null;
}
function lit(t, v) {
  v = v.trim();
  if (t === 'integer') return v;
  if (t === 'long') return v + 'L';
  if (t === 'double') return v.includes('.') || /e/i.test(v) ? v : v + '.0';
  if (t === 'boolean') return v;
  if (t === 'string') return v;
  if (t === 'character') return "'" + JSON.parse(v) + "'";
  let mm = t.match(/^(.*)\[\]$/);
  if (mm) {
    const inner = v.slice(1, -1); const parts = inner.trim() === '' ? [] : splitTop(inner);
    return 'new ' + javaType(t) + '{' + parts.map(p => lit(mm[1], p)).join(',') + '}';
  }
  mm = t.match(/^list<(.*)>$/);
  if (mm) {
    const inner = v.slice(1, -1); const parts = inner.trim() === '' ? [] : splitTop(inner);
    return 'new java.util.ArrayList<' + boxed(mm[1]) + '>(java.util.Arrays.<' + boxed(mm[1]) + '>asList(' + parts.map(p => lit(mm[1], p)).join(',') + '))';
  }
  throw new Error('lit ' + t);
}

function stripHtml(h) {
  return h.replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

const slugs = fs.readdirSync('problems').map(f => f.replace('.json', '')).filter(s => JSON.parse(fs.readFileSync('problems/' + s + '.json')).language === 'java').filter(s => !only.length || only.includes(s));
const manifest = [];
const results = {};
for (const slug of slugs) {
  const code = JSON.parse(fs.readFileSync('problems/' + slug + '.json')).code;
  const metaFile = sp + '/meta/' + slug + '.json';
  if (!fs.existsSync(metaFile)) { results[slug] = 'SKIP:nometa'; continue; }
  const q = JSON.parse(fs.readFileSync(metaFile));
  if (!q || !q.content || !q.metaData) { results[slug] = 'SKIP:premium'; continue; }
  let meta; try { meta = JSON.parse(q.metaData); } catch (e) { results[slug] = 'SKIP:meta'; continue; }
  if (meta.systemdesign || meta.classname || !meta.params) { results[slug] = 'SKIP:design'; continue; }
  const ptypes = meta.params.map(p => p.type);
  const rtype = meta.return && meta.return.type;
  if (!rtype || rtype === 'void' || ptypes.some(t => !javaType(t)) || !javaType(rtype) && !/^list/.test(rtype)) { results[slug] = 'SKIP:types(' + ptypes.concat(rtype).join(',') + ')'; continue; }
  // inputs and outputs both come from the statement's examples so they always correspond
  const text = stripHtml(q.content);
  const flat = s => s.replace(/\s+/g, ' ').trim();
  const outs = [...text.matchAll(/Output:\s*([\s\S]*?)(?=\n\s*(?:Explanation|Example|Constraints)|\s*$)/g)].map(m => flat(m[1]));
  const inputs = [...text.matchAll(/Input:\s*([\s\S]*?)(?=\n\s*Output:)/g)].map(m => flat(m[1]));
  if (!inputs.length || inputs.length !== outs.length) { results[slug] = 'SKIP:examples'; continue; }
  const names = meta.params.map(p => p.name);
  const examples = [];
  let parseFail = false;
  for (const line of inputs) {
    const starts = names.map(n => { const m = line.match(new RegExp('(^|[\\s,])' + n + '\\s*=\\s*')); return m ? m.index + m[0].length : -1; });
    if (starts.some(s => s < 0)) { parseFail = true; break; }
    const order = starts.map((s, k) => [s, k]).sort((a, b) => a[0] - b[0]);
    const vals = new Array(names.length);
    order.forEach(([s, k], idx) => {
      const nextStart = idx + 1 < order.length ? order[idx + 1][0] : line.length + 1;
      const rawEnd = idx + 1 < order.length ? line.lastIndexOf(names[order[idx + 1][1]], nextStart) : line.length;
      vals[k] = line.slice(s, rawEnd).trim().replace(/,\s*$/, '').trim();
    });
    examples.push(vals);
  }
  if (parseFail) { results[slug] = 'SKIP:inputparse'; continue; }
  let calls = '';
  try {
    examples.forEach((ex, i) => {
      const args = ex.map((v, k) => lit(ptypes[k], v)).join(',');
      calls += `try{System.out.println("#${i}|"+fmt(new Solution().${meta.name}(${args})));}catch(Throwable t){System.out.println("#${i}|EXC "+t);}\n`;
    });
  } catch (e) { results[slug] = 'SKIP:lit'; continue; }
  const dir = path.join(work, slug); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
  const imports = [...code.matchAll(/^import .*;$/gm)].map(m => m[0]);
  const body = code.replace(/^import .*;$/gm, '').replace(/^public (class|interface)/gm, '$1');
  const stubs = Object.entries(STUBS).filter(([n]) => !new RegExp('\\bclass ' + n + '\\b').test(body)).map(([, s]) => s).join('\n');
  const main = `import java.util.*;import java.util.stream.*;\n${imports.join('\n')}\n${stubs}\n${body}\nclass H{${FMT}\n public static void main(String[] a){\n${calls}}}\n`;
  fs.writeFileSync(path.join(dir, 'H.java'), main);
  manifest.push({slug, dir, expected: outs.slice(0, examples.length)});
}

function run(cmd, args, cwd, timeout) {
  return new Promise(res => {
    const p = spawn(cmd, args, {cwd}); let out = '', err = '';
    const t = setTimeout(() => { p.kill(); res({code: -9, out, err: err + 'TIMEOUT'}); }, timeout);
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d);
    p.on('close', c => { clearTimeout(t); res({code: c, out, err}); });
  });
}

function norm(s) { return s.replace(/\s+/g, ''); }
function numEq(a, b) {
  const na = a.match(/-?\d+(\.\d+)?(e[-+]?\d+)?/gi), nb = b.match(/-?\d+(\.\d+)?(e[-+]?\d+)?/gi);
  if (!na || !nb || na.length !== nb.length) return false;
  return na.every((x, i) => Math.abs(parseFloat(x) - parseFloat(nb[i])) <= 1e-4 * Math.max(1, Math.abs(parseFloat(nb[i]))));
}
function sortChars(s) { return norm(s).split('').sort().join(''); }

let idx = 0;
async function worker() {
  while (idx < manifest.length) {
    const m = manifest[idx++];
    const c = await run('javac', ['-nowarn', 'H.java'], m.dir, 120000);
    if (c.code !== 0) { results[m.slug] = 'ERR:compile ' + c.err.split('\n')[0]; continue; }
    const r = await run('java', ['-Xss64m', 'H'], m.dir, 20000);
    if (r.err.includes('TIMEOUT')) { results[m.slug] = 'ERR:timeout'; continue; }
    const got = {};
    for (const l of r.out.split(/\r?\n/)) { const mm = l.match(/^#(\d+)\|(.*)$/); if (mm) got[mm[1]] = mm[2]; }
    let status = 'PASS', detail = '';
    m.expected.forEach((e, i) => {
      const a = got[i] === undefined ? 'MISSING' : got[i];
      if (norm(a) === norm(e)) return;
      if (a.startsWith('EXC')) { status = 'ERR'; detail += ` [${i}] ${a}`; return; }
      if (numEq(a, e) && /[\d.]/.test(e) && !/[a-z"]/i.test(e)) return;
      if (sortChars(a) === sortChars(e)) { if (status === 'PASS') status = 'SOFT'; detail += ` [${i}] got ${a} exp ${e}`; return; }
      status = 'FAIL'; detail += ` [${i}] got ${a} exp ${e}`;
    });
    results[m.slug] = status + (detail ? ':' + detail.slice(0, 300) : '');
  }
}
await Promise.all(Array.from({length: 8}, worker));
fs.writeFileSync(sp + '/verify-results.json', JSON.stringify(results, null, 1));
const counts = {};
for (const v of Object.values(results)) { const k = v.split(/[:\s]/)[0]; counts[k] = (counts[k] || 0) + 1; }
console.log(counts);
for (const [s, v] of Object.entries(results)) if (/^(FAIL|ERR)/.test(v)) console.log(s, '=>', v);
