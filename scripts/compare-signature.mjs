// compare expected vs actual public method lines for the given slugs
import fs from 'fs';
const sp = (process.env.SP||'scripts/.work');
for (const s of process.argv.slice(2)) {
  const snip = fs.readFileSync(sp + '/snip/' + s + '.txt', 'utf8');
  const code = JSON.parse(fs.readFileSync('problems/' + s + '.json')).code;
  const grab = c => [...c.matchAll(/^\s*public[^\n{;]*\(/gm)].map(m => m[0].trim());
  console.log('## ' + s);
  console.log(' want: ' + grab(snip).join(' || '));
  console.log(' have: ' + grab(code).join(' || '));
}
