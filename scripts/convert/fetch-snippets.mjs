// node scripts/convert/fetch-snippets.mjs : fetch LeetCode's Java starter code for every slug in <dir>/todo.json.
// Free problems are public; premium ones need --browser (the logged-in Premium profile, Chrome not in use). Writes <dir>/meta/<slug>.json and <dir>/convert.json (slugs that offer Java at all;
// SQL, Bash and JS-only problems have no Java starter and are left out).
import fs from 'fs';

const dir = process.env.CONVERT_DIR || 'scripts/.work/convert';
fs.mkdirSync(`${dir}/meta`, {recursive: true});
const slugs = JSON.parse(fs.readFileSync(`${dir}/todo.json`, 'utf8'));
const QUERY = 'query($s:String!){question(titleSlug:$s){content codeSnippets{langSlug code}}}';
let i = 0, failed = 0;
let page = null;
if (process.argv.includes('--browser')) {
  const {getBrowserDetails} = await import('../../managers/BrowserManager.js');
  ({page} = await getBrowserDetails());
}
const {gql} = await import('../../utils/utils.js');
const fetchQuestion = async (s) => {
  if (page) return (await gql(page, QUERY, {s})).question;
  const r = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {'content-type': 'application/json', referer: 'https://leetcode.com/'},
    body: JSON.stringify({query: QUERY, variables: {s}}),
  });
  return (await r.json()).data.question;
};
async function worker() {
  while (i < slugs.length) {
    const s = slugs[i++], out = `${dir}/meta/${s}.json`;
    if (fs.existsSync(out)) continue;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const q = await fetchQuestion(s);
        if (q.content === null) throw new Error(`${s}: content hidden (premium question without a Premium login?)`);
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
await Promise.all(Array.from({length: page ? 1 : 4}, worker)); // one browser page: fetch sequentially
const convert = slugs.filter((s) => fs.existsSync(`${dir}/meta/${s}.json`) && JSON.parse(fs.readFileSync(`${dir}/meta/${s}.json`, 'utf8')).java);
fs.writeFileSync(`${dir}/convert.json`, JSON.stringify(convert));
console.log(`${convert.length} of ${slugs.length} offer Java (${failed} fetch failures)`);
if (page) {
  const {closeBrowser} = await import('../../managers/BrowserManager.js');
  await closeBrowser();
}
process.exit(0);
