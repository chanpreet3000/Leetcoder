// npm test: offline checks for the solver's pure logic and the local state files (no browser, no LeetCode).
import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'leetcoder-selftest-'))); // UserData/ paths resolve against cwd
process.env.USER_EMAIL = 'selftest@example.com';

const {describeFailure} = await import(`${repo}/leetcoder/LeetcoderSolver.js`);
const {default: FileManager} = await import(`${repo}/managers/FileManager.js`);
const {GOOGLE_CHROME_EXECUTABLE_PATH, FAILED_PROBLEMS_PATH} = await import(`${repo}/data.js`);

// verdict details
assert.equal(
  describeFailure({statusDisplay: 'Wrong Answer', totalCorrect: 531, totalTestcases: 573, lastTestcase: '5637\n2034', expectedOutput: '34943', codeOutput: '28613'}),
  '531/573 testcases passed; input="5637\\n2034" expected=34943 got=28613');
assert.equal(describeFailure({statusDisplay: 'Time Limit Exceeded', totalCorrect: 9, totalTestcases: 10, lastTestcase: '[1]'}),
  '9/10 testcases passed; input="[1]"');
assert.equal(describeFailure({statusDisplay: 'Compile Error', totalTestcases: 0, compileError: 'Line 4: error'}), 'Line 4: error');

// failure ledger: record, overwrite, clear, clear-missing is a no-op
await FileManager.recordProblemIssue('a', 'failed', 'boom', {kind: 'infra'});
await FileManager.recordProblemIssue('b', 'skipped', 'premium-only question');
await FileManager.recordProblemIssue('a', 'failed', 'Wrong Answer', {kind: 'solution'});
await FileManager.recordProblemIssue('b', null);
await FileManager.recordProblemIssue('missing', null);
const issues = JSON.parse(fs.readFileSync(FAILED_PROBLEMS_PATH, 'utf8'));
assert.deepEqual(Object.keys(issues), ['a']);
assert.equal(issues.a.kind, 'solution');
assert.ok(!fs.existsSync(`${FAILED_PROBLEMS_PATH}.tmp`), 'atomic write left its temp file behind');

// user skip / un-skip
await FileManager.setProblemSkipped('a', true);
await FileManager.setProblemSkipped('c', true);
let after = await FileManager.getProblemIssues();
assert.equal(after.a.skip, true);
assert.equal(after.a.verdict ?? after.a.reason, 'Wrong Answer'); // skipping keeps the failure reason
assert.equal(after.c.reason, 'skipped by you');
await FileManager.setProblemSkipped('a', false);
await FileManager.setProblemSkipped('c', false);
after = await FileManager.getProblemIssues();
assert.equal(after.a.skip, undefined);
assert.ok(!('c' in after), 'un-skipping a problem that never failed removes it');

// solved cache survives a round trip
await FileManager.setSolvedProblemSet('two-sum');
assert.ok((await FileManager.getSolvedProblemSet()).has('two-sum'));

// Chrome path default per platform
if (!process.env.GOOGLE_CHROME_EXECUTABLE_PATH) {
  const expected = {darwin: 'Contents/MacOS/Google Chrome', win32: 'chrome.exe'}[process.platform];
  if (expected) assert.ok(GOOGLE_CHROME_EXECUTABLE_PATH.endsWith(expected), GOOGLE_CHROME_EXECUTABLE_PATH);
}

console.log('selftest: all checks passed');
