// node scripts/convert/fetch-snippets.mjs : fetch LeetCode's Java starter code for every slug in <dir>/todo.json.
// Public data, no login needed. Writes <dir>/meta/<slug>.json and <dir>/convert.json (slugs that offer Java at all;
// SQL, Bash and JS-only problems have no Java starter and are left out).
import fs from 'fs';

const dir = process.env.CONVERT_DIR || 'scripts/.work/convert';
fs.mkdirSync(`${dir}/meta`, {recursive: true});
const slugs = JSON.parse(fs.readFileSync(`${dir}/todo.json`, 'utf8'));
let i = 0, failed = 0;
async function worker() {
  while (i < slugs.length) {
    const s = slugs[i++], out = `${dir}/meta/${s}.json`;
    if (fs.existsSync(out)) continue;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const r = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: {'content-type': 'application/json', referer: 'https://leetcode.com/'},
          body: JSON.stringify({query: 'query($s:String!){question(titleSlug:$s){content codeSnippets{langSlug code}}}', variables: {s}}),
        });
        const q = (await r.json()).data.question;
        const java = q.codeSnippets?.find((c) => c.langSlug === 'java')?.code ?? null;
        fs.writeFileSync(out, JSON.stringify({java, content: q.content}));
        break;
      } catch (e) {
        if (attempt === 3) failed++;
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }
}
await Promise.all(Array.from({length: 4}, worker));
const convert = slugs.filter((s) => fs.existsSync(`${dir}/meta/${s}.json`) && JSON.parse(fs.readFileSync(`${dir}/meta/${s}.json`, 'utf8')).java);
fs.writeFileSync(`${dir}/convert.json`, JSON.stringify(convert));
console.log(`${convert.length} of ${slugs.length} offer Java (${failed} fetch failures)`);
