// fetch LeetCode's Java starter snippet for every java solution and compare method signatures (types only)
import fs from 'fs';
const sp = (process.env.SP||'scripts/.work');
fs.mkdirSync(sp + '/snip', {recursive: true});
const slugs = fs.readdirSync('problems').map(f => f.replace('.json', '')).filter(s => JSON.parse(fs.readFileSync('problems/' + s + '.json')).language === 'java');
let i = 0;
async function worker() {
  while (i < slugs.length) {
    const s = slugs[i++];
    const out = sp + '/snip/' + s + '.txt';
    if (fs.existsSync(out)) continue;
    for (let a = 0; a < 3; a++) {
      try {
        const r = await fetch('https://leetcode.com/graphql', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({query: 'query q($s:String!){question(titleSlug:$s){codeSnippets{langSlug code}}}', variables: {s}})});
        const q = (await r.json()).data.question;
        const j = q && q.codeSnippets && q.codeSnippets.find(c => c.langSlug === 'java');
        fs.writeFileSync(out, j ? j.code : '');
        break;
      } catch (e) { await new Promise(r => setTimeout(r, 1500)); }
    }
  }
}
await Promise.all(Array.from({length: 6}, worker));

// signature = "returnType name(paramType, paramType)" for every public method line
function sigs(code) {
  const out = [];
  for (const m of code.matchAll(/public\s+(?:static\s+)?([\w<>\[\],\s?]+?)\s+(\w+)\s*\(([^)]*)\)/g)) {
    const params = m[3].split(',').map(p => p.trim()).filter(Boolean).map(p => p.replace(/\s+\w+$/, '').replace(/\s+/g, ''));
    out.push(m[1].replace(/\s+/g, '') + ' ' + m[2] + '(' + params.join(',') + ')');
  }
  return out;
}
const bad = [];
for (const s of slugs) {
  const snip = fs.readFileSync(sp + '/snip/' + s + '.txt', 'utf8');
  if (!snip) continue;
  const code = JSON.parse(fs.readFileSync('problems/' + s + '.json')).code;
  const want = sigs(snip), have = new Set(sigs(code));
  const missing = want.filter(w => !have.has(w));
  if (missing.length) bad.push(s + ' :: ' + missing.join(' | '));
}
console.log(bad.length);
console.log(bad.join('\n'));
