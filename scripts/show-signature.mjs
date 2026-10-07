// print the expected method signature for each slug
import fs from 'fs';
const sp = (process.env.SP||'scripts/.work');
for (const s of process.argv.slice(2)) {
  const q = JSON.parse(fs.readFileSync(sp + '/meta/' + s + '.json'));
  if (!q || !q.metaData) { console.log(s, 'NO META'); continue; }
  const m = JSON.parse(q.metaData);
  if (m.classname) { console.log(s, 'CLASS', m.classname, JSON.stringify(m.constructor), JSON.stringify((m.methods || []).map(x => x.name + '(' + x.params.map(p => p.type).join(',') + '):' + x.return.type))); continue; }
  console.log(s, m.return.type, m.name + '(' + m.params.map(p => p.type + ' ' + p.name).join(', ') + ')');
}
