// static check: every java solution defines the method (or class) that LeetCode expects
import fs from 'fs';
const sp = (process.env.SP||'scripts/.work');
const bad = [];
for (const f of fs.readdirSync('problems')) {
  const s = f.replace('.json', '');
  const j = JSON.parse(fs.readFileSync('problems/' + f));
  if (j.language !== 'java') continue;
  const mf = sp + '/meta/' + s + '.json';
  if (!fs.existsSync(mf)) continue;
  const q = JSON.parse(fs.readFileSync(mf));
  if (!q || !q.metaData) continue;
  let m;
  try { m = JSON.parse(q.metaData); } catch (e) { continue; }
  if (m.classname) {
    if (!new RegExp('class\\s+' + m.classname + '\\b').test(j.code)) bad.push(s + ' (missing class ' + m.classname + ')');
    continue;
  }
  if (m.name && !new RegExp('\\b' + m.name + '\\s*\\(').test(j.code)) bad.push(s + ' (missing method ' + m.name + ')');
}
console.log(bad.length);
console.log(bad.join('\n'));
