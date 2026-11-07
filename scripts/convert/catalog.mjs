// node scripts/convert/catalog.mjs [--premium] : list the unsolved problems whose local solution is not Java yet.
// Free problems by default; with --premium, the premium-only ones (including those with no local solution at all).
// Needs a logged-in profile (mode L) and Chrome not in use by the bot. Writes <dir>/catalog.json and <dir>/todo.json.
import fs from 'fs';
import {getBrowserDetails, closeBrowser} from '../../managers/BrowserManager.js';
import {gql} from '../../utils/utils.js';

const dir = process.env.CONVERT_DIR || 'scripts/.work/convert';
fs.mkdirSync(dir, {recursive: true});
const {page} = await getBrowserDetails();
const {userStatus} = await gql(page, '{userStatus{isSignedIn username isPremium}}');
if (!userStatus?.isSignedIn) {
  await closeBrowser();
  console.error('Not logged in: solved statuses would all read TO_DO. Run npm start, mode L, then retry.');
  process.exit(1);
}
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

const premium = process.argv.includes('--premium');
const language = (s) => fs.existsSync(`problems/${s}.json`) ? JSON.parse(fs.readFileSync(`problems/${s}.json`, 'utf8')).language : null;
const unsolved = rows.filter((q) => q.status !== 'SOLVED' && q.paidOnly === premium).map((q) => q.titleSlug);
// free: only existing non-Java files; premium: also questions with no solution file yet
const todo = unsolved.filter((s) => language(s) !== 'java' && (premium || language(s) !== null));
fs.writeFileSync(`${dir}/todo.json`, JSON.stringify(todo));
const solved = rows.filter((q) => q.status === 'SOLVED').length;
const ready = unsolved.filter((s) => language(s) === 'java').length;
console.log(`catalogue ${rows.length}, solved ${solved}; unsolved ${premium ? 'premium' : 'free'}: ${unsolved.length}, ` +
  `already Java ${ready}, to write in Java ${todo.length} (${todo.filter((s) => !language(s)).length} have no solution yet)`);
if (premium && !userStatus.isPremium) console.log('warning: this account has no Premium, so premium questions cannot be submitted');
process.exit(0);
