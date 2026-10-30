// node scripts/convert/catalog.mjs : list every free, unsolved problem whose local solution is not Java yet.
// Needs a logged-in profile (mode L) and Chrome not in use by the bot. Writes <dir>/catalog.json and <dir>/todo.json.
import fs from 'fs';
import {getBrowserDetails, closeBrowser} from '../../managers/BrowserManager.js';
import {gql} from '../../utils/utils.js';

const dir = process.env.CONVERT_DIR || 'scripts/.work/convert';
fs.mkdirSync(dir, {recursive: true});
const {page} = await getBrowserDetails();
const rows = [];
for (let skip = 0; ; skip += 100) { // the API caps a page at 100 questions
  const {problemsetQuestionListV2: q} = await gql(page,
    `query($skip:Int!){problemsetQuestionListV2(categorySlug:"",limit:100,skip:$skip){totalLength questions{titleSlug difficulty paidOnly status}}}`,
    {skip});
  rows.push(...q.questions);
  if (rows.length >= q.totalLength || q.questions.length === 0) break;
}
await closeBrowser();
fs.writeFileSync(`${dir}/catalog.json`, JSON.stringify(rows));

const todo = rows
  .filter((q) => q.status !== 'SOLVED' && !q.paidOnly && fs.existsSync(`problems/${q.titleSlug}.json`))
  .map((q) => q.titleSlug)
  .filter((s) => JSON.parse(fs.readFileSync(`problems/${s}.json`, 'utf8')).language !== 'java');
fs.writeFileSync(`${dir}/todo.json`, JSON.stringify(todo));
const solved = rows.filter((q) => q.status === 'SOLVED').length;
console.log(`catalogue ${rows.length}, solved ${solved}, non-Java solutions to convert ${todo.length}`);
process.exit(0);
