import {copyHelper, gql, pasteHelper, selectAllHelper, sleep} from "../utils/utils.js";
import {LANGUAGE_DISPLAY_MAP} from "../utils/constants.js";
import clipboardy from "clipboardy";
import {createHash} from "crypto";
import Logger from "../utils/Logger.js";
import FileManager from "../managers/FileManager.js";
import {getBrowserDetails} from "../managers/BrowserManager.js";

// Selectors use LeetCode's test hooks / ARIA / class names instead of positional XPaths, which break on every layout change.
const SUBMIT_BTN = '[data-e2e-locator="console-submit-button"]';
const LANGUAGE_POPUP = '[data-radix-popper-content-wrapper]';
const EDITOR = '[data-leetcoder="editor"]';
const LANGUAGE_BTN = '[data-leetcoder="language"]';
const PENDING_VERDICT = /^(pending|started|judging|running|queued)/i;
// These mean the problem file itself needs fixing; every other failure is infrastructure and a rerun may pass.
const SOLUTION_VERDICTS = ["Wrong Answer", "Time Limit Exceeded", "Memory Limit Exceeded", "Output Limit Exceeded",
  "Runtime Error", "Compile Error", "Restrictions Failed", "Unknown Problem", "Unsupported Language", "Language Missing"];
const MAX_CONSECUTIVE_INFRA_FAILURES = 5; // stop instead of flooding FailedProblems.json when LeetCode or Chrome is down
const CANARY_PROBLEM = "two-sum";
const SUBMISSION_GAP_MS = 12000; // back-to-back submissions get rate-limited (HTTP 429) roughly every fourth time

// Identifies the exact code that failed, so an unchanged solution is not resubmitted but an edited one is retried.
const codeHash = (code) => createHash("sha1").update(code.replace(/\r\n/g, "\n").trim()).digest("hex").slice(0, 12);
const issueKind = (issue) =>
  issue.skip || issue.status === "skipped" ? "skipped" : issue.kind ?? (SOLUTION_VERDICTS.includes(issue.verdict) ? "solution" : "infra");

// Errors from a step carry a verdict (Wrong Answer, Rate Limited, ...) so they can be classified and recorded.
const failure = (verdict, details, submissionId) =>
  Object.assign(new Error(`${verdict}${details ? `: ${details}` : ""}`), {verdict, submissionId});

export const describeFailure = (d) => {
  const counts = d.totalTestcases ? `${d.totalCorrect}/${d.totalTestcases} testcases passed` : "";
  const input = `input=${JSON.stringify(d.lastTestcase)}`;
  const detail = {
    "Wrong Answer": `${input} expected=${d.expectedOutput} got=${d.codeOutput}`,
    "Runtime Error": `${d.runtimeError || ""} ${input}`,
    "Compile Error": d.compileError || d.codeOutput || "",
  }[d.statusDisplay] ?? input; // Time/Memory/Output Limit Exceeded
  return [counts, detail].filter(Boolean).join("; ").slice(0, 600);
};

// Runs in the page: tags the code editor and its language button with data-leetcoder, so later steps hit exactly
// those and not the testcase editor or some other button that reads "Java". The code editor is the one sharing the
// smallest panel with a language button. Returns the button's label, or null when either is missing.
const tagEditorInPage = (labels) => {
  document.querySelectorAll("[data-leetcoder]").forEach((el) => delete el.dataset.leetcoder);
  let best = null;
  for (const editor of document.querySelectorAll(".monaco-editor")) {
    let depth = 0;
    for (let panel = editor.parentElement; panel; panel = panel.parentElement) depth++;
    for (let panel = editor.parentElement; panel; panel = panel.parentElement, depth--) {
      const button = [...panel.querySelectorAll("button")].find((b) => labels.includes(b.textContent.trim()));
      if (button) {
        if (!best || depth > best.depth) best = {editor, button, depth};
        break;
      }
    }
  }
  if (!best) return null;
  best.editor.dataset.leetcoder = "editor";
  best.button.dataset.leetcoder = "language";
  return best.button.textContent.trim();
};
const LANGUAGE_LABELS = Object.values(LANGUAGE_DISPLAY_MAP);
const tagEditor = (page, expectedLabel, timeout = 15000) =>
  page.waitForFunction(
    `(${tagEditorInPage})(${JSON.stringify(LANGUAGE_LABELS)})${expectedLabel ? ` === ${JSON.stringify(expectedLabel)}` : ""}`,
    {timeout, polling: 250}
  ).catch(() => {
    throw failure("Editor Not Found", expectedLabel ? `language did not switch to ${expectedLabel}` : "no code editor with a language button");
  });

const normalize = (code) => code.replace(/\r\n/g, "\n").trimEnd();

class LeetcoderSolver {
  static #lastSubmitAt = 0;

  static async #openProblem(page, problemName) {
    await page.goto(`https://leetcode.com/problems/${problemName}/`, {waitUntil: "domcontentloaded", timeout: 60000});
    await page.waitForSelector(SUBMIT_BTN, {visible: true, timeout: 30000})
      .catch(() => { throw failure("Page Not Ready", "submit button did not appear within 30s"); });
    await tagEditor(page);
  }

  static async #openLanguageMenu(page) {
    await page.click(LANGUAGE_BTN);
    await page.waitForSelector(LANGUAGE_POPUP, {visible: true, timeout: 5000})
      .catch(() => { throw failure("Editor Not Found", "language menu did not open"); });
  }

  static #findLanguageOption(page, label) {
    return page.evaluateHandle((sel, t) =>
      [...document.querySelectorAll(`${sel} div`)].find((d) => d.children.length === 0 && d.textContent.trim() === t), LANGUAGE_POPUP, label);
  }

  static async #selectLanguage(page, label) {
    if (await page.$eval(LANGUAGE_BTN, (b) => b.textContent.trim()) === label) return;
    await this.#openLanguageMenu(page);
    const option = (await this.#findLanguageOption(page, label)).asElement();
    if (!option) throw failure("Language Missing", `"${label}" is not in the editor's language list`);
    await option.click();
    await tagEditor(page, label, 10000); // switching re-renders the editor, so re-tag and confirm the new label
  }

  // Pastes the solution, then reads the editor back and only returns once it holds exactly that code,
  // so a misfired paste (or the user touching the clipboard mid-run) never gets submitted.
  static async #writeCode(page, code) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      clipboardy.writeSync(code);
      await page.click(`${EDITOR} .view-lines`);
      await selectAllHelper(page);
      await page.keyboard.press("Backspace");
      await pasteHelper(page);
      for (let check = 0; check < 5; check++) {
        await sleep(0.3);
        await selectAllHelper(page);
        await copyHelper(page);
        if (normalize(clipboardy.readSync()) === normalize(code)) return;
      }
    }
    throw failure("Editor Mismatch", "the editor did not end up holding the solution after two paste attempts");
  }

  // Clicks Submit and returns the submission id; waits out rate limits (HTTP 429) before giving up.
  static async #submit(page) {
    for (let attempt = 0; ; attempt++) {
      const gap = this.#lastSubmitAt + SUBMISSION_GAP_MS - Date.now(); // time spent on this problem already counts
      if (gap > 0) await sleep(gap / 1000);
      const submitResponse = page.waitForResponse(
        (r) => r.request().method() === "POST" && /\/problems\/[^/]+\/submit\/?$/.test(new URL(r.url()).pathname),
        {timeout: 20000} // LeetCode normally answers the submit request within a second or two
      );
      await page.click(SUBMIT_BTN);
      this.#lastSubmitAt = Date.now();
      const response = await submitResponse.catch(() => null);
      if (response?.status() === 429 && attempt < 3) {
        const wait = Number(response.headers()["retry-after"]) || 60 * 2 ** attempt;
        Logger.warn(`[RATE_LIMITED]\t\t:waiting ${wait}s before resubmitting`);
        await sleep(wait);
        continue;
      }
      const body = response ? await response.json().catch(() => ({})) : {};
      if (response?.ok() && body.submission_id) return body.submission_id;
      if (!response) throw failure("Submission Blocked", "no answer to the submit request within 20s");
      const details = `HTTP ${response.status()}${Object.keys(body).length ? `: ${JSON.stringify(body).slice(0, 300)}` : ""}`;
      throw failure(response.status() === 429 ? "Rate Limited" : "Submission Blocked", details);
    }
  }

  // Polls LeetCode's own submission record; resolves on Accepted and throws with the verdict and its details otherwise.
  static async #awaitVerdict(page, submissionId) {
    const deadline = Date.now() + 60000;
    for (;;) {
      await sleep(1);
      let d;
      try {
        ({submissionDetails: d} = await gql(
          page,
          `query($id:Int!){submissionDetails(submissionId:$id){
            statusDisplay totalCorrect totalTestcases lastTestcase expectedOutput codeOutput runtimeError compileError}}`,
          {id: Number(submissionId)}
        ));
      } catch (_) {
        // record not readable yet; fall through to the deadline check
      }
      const verdict = d?.statusDisplay;
      if (verdict && !PENDING_VERDICT.test(verdict)) {
        if (verdict === "Accepted") return;
        throw failure(verdict, describeFailure(d), submissionId);
      }
      // checked after a poll, so a laptop waking from sleep past the deadline still reads the verdict first
      if (Date.now() > deadline) throw failure("Verdict Timeout", "no verdict after 60s", submissionId);
    }
  }

  // Canary: proves every locator the solver needs still resolves on a real problem page, without typing or submitting.
  static async preflight() {
    Logger.warn(`[PREFLIGHT]\t\t\t:checking the LeetCode page layout on ${CANARY_PROBLEM}`);
    const {page} = await getBrowserDetails();
    await this.#openProblem(page, CANARY_PROBLEM);
    await this.#openLanguageMenu(page);
    const option = (await this.#findLanguageOption(page, LANGUAGE_DISPLAY_MAP.java)).asElement();
    await page.keyboard.press("Escape");
    if (!option) throw failure("Language Missing", "Java is not in the editor's language list");
    Logger.success(`[PREFLIGHT_OK]\t\t\t:editor, language menu and submit button all found`);
  }

  // Decides from the local state alone whether a problem is worth a page load and a submission.
  static async #shouldAttempt(problemName) {
    if ((await FileManager.getSolvedProblemSet()).has(problemName)) {
      Logger.success(`[SOLVED_EARLIER]\t\t:${problemName}`);
      return false;
    }
    const issue = (await FileManager.getProblemIssues())[problemName];
    if (issue?.skip) {
      Logger.warn(`[SKIPPED_BY_YOU]\t\t:${problemName}`);
      return false;
    }
    if (issue && issueKind(issue) === "solution" && issue.codeHash) {
      const {code} = await FileManager.getProblemDetails(problemName);
      if (codeHash(code) === issue.codeHash) {
        Logger.warn(`[NEEDS_FIX]\t\t\t:${problemName} (${issue.verdict}; unchanged since it failed, see mode F)`);
        return false;
      }
    }
    return true;
  }

  static #premium = null;

  // asked once per run: premium questions are only submittable with a Premium subscription
  static async #hasPremium(page) {
    if (this.#premium === null) this.#premium = !!(await gql(page, "{userStatus{isPremium}}")).userStatus?.isPremium;
    return this.#premium;
  }

  // Returns the failure kind ('solution' | 'infra') or null when the problem was accepted or skipped.
  static async #solveProblemWithName(problemName) {
    let page, code;
    try {
      ({page} = await getBrowserDetails());
      // Ask LeetCode first: already-solved and premium problems need no page load at all.
      const {question} = await gql(page, "query($s:String!){question(titleSlug:$s){status isPaidOnly}}", {s: problemName});
      if (!question) throw failure("Unknown Problem", `LeetCode has no question "${problemName}"`);
      if (question.status === "ac") {
        Logger.warn(`[ALREADY_SOLVED]\t\t:${problemName}`);
        await FileManager.recordProblemIssue(problemName, null);
        await FileManager.setSolvedProblemSet(problemName);
        return null;
      }
      if (question.isPaidOnly && !(await this.#hasPremium(page))) {
        // not cached as solved, so it is attempted once the account has Premium
        Logger.warn(`[PREMIUM_QUESTION]\t\t:${problemName}. Skipped: this account has no Premium.`);
        return null;
      }

      Logger.warn(`[NAVIGATING]\t\t\t:${problemName}`);
      await this.#openProblem(page, problemName);

      let language;
      ({code, language} = await FileManager.getProblemDetails(problemName));
      Logger.warn(`[LOADED_SOLUTION]\t\t:${problemName} (language: ${language}, ${code.length} chars)`);
      const targetLabel = LANGUAGE_DISPLAY_MAP[language];
      if (!targetLabel) throw failure("Unsupported Language", `"${language}"; add it to LANGUAGE_DISPLAY_MAP in utils/constants.js`);

      Logger.warn(`[SWITCHING_LANGUAGE]\t\t:${language}`);
      await this.#selectLanguage(page, targetLabel);
      await this.#writeCode(page, code);

      Logger.warn(`[SUBMITTING]\t\t\t:${problemName}`);
      const submissionId = await this.#submit(page);
      Logger.warn(`[AWAITING_VERDICT]\t\t:submission ${submissionId}`);
      await this.#awaitVerdict(page, submissionId);

      Logger.success(`[ACCEPTED]\t\t\t:${problemName}`);
      await FileManager.recordProblemIssue(problemName, null);
      await FileManager.setSolvedProblemSet(problemName);
      return null;
    } catch (err) {
      const kind = SOLUTION_VERDICTS.includes(err.verdict) ? 'solution' : 'infra';
      Logger.error(`[FAILED]\t\t: ${problemName} (${kind})`, err);
      if (kind === 'infra' && page) await FileManager.saveFailureArtifacts(problemName, page).catch(() => {});
      const extra = {kind, verdict: err.verdict, submissionId: err.submissionId, codeHash: code && codeHash(code)};
      await FileManager.recordProblemIssue(problemName, 'failed', err?.message || err, extra).catch(() => {});
      return kind;
    }
  }

  static async #solveProblems(problemNames) {
    let infraStreak = 0;
    for (const problemName of problemNames) {
      if (!(await this.#shouldAttempt(problemName))) continue;
      infraStreak = (await this.#solveProblemWithName(problemName)) === 'infra' ? infraStreak + 1 : 0;
      if (infraStreak >= MAX_CONSECUTIVE_INFRA_FAILURES) {
        throw new Error(`Stopping: ${infraStreak} problems in a row failed for non-solution reasons (see FailedProblems.json and the failures/ screenshots).`);
      }
    }
  }

  static async solve() {
    Logger.error('<<<< Starting Leetcoder Solver >>>>');
    const allProblemsName = await FileManager.getAllProblemsNames();
    Logger.success(`[QUEUED]\t\t\t:${allProblemsName.length} problems to process`);
    await this.preflight();
    await this.#solveProblems(allProblemsName);
    await this.#printBucketSummary();
    Logger.error('<<<< Exiting Leetcoder Solver >>>>');
  }

  static async #groupedIssues() {
    const groups = {solution: [], infra: [], skipped: []};
    for (const [name, issue] of Object.entries(await FileManager.getProblemIssues())) groups[issueKind(issue)].push([name, issue]);
    return groups;
  }

  static async #printBucketSummary() {
    const g = await this.#groupedIssues();
    Logger.warn(`[BUCKET]\t\t\t:${g.solution.length} need a better solution, ${g.infra.length} should pass on a rerun, ${g.skipped.length} skipped. Run mode F to review.`);
  }

  // Mode F: shows every failed / skipped problem with its reason and what to do, then lets the user skip or un-skip some.
  static async reviewFailures(ask) {
    const g = await this.#groupedIssues();
    const section = (title, rows, line) => {
      console.log(`\n${title} (${rows.length})`);
      for (const [name, issue] of rows) console.log(`  ${name}\n      ${line(issue)}`);
    };
    section("NEEDS A BETTER SOLUTION: edit problems/<name>.json and it is retried on the next run", g.solution,
      (i) => i.reason.split("\n")[0].slice(0, 220));
    section("SHOULD PASS ON A RERUN: page, network or rate-limit problems (screenshots in failures/)", g.infra,
      (i) => i.reason.split("\n")[0].slice(0, 220));
    section("SKIPPED: never attempted", g.skipped, (i) => i.reason);

    const answer = (await ask("\nProblems to skip from now on, comma-separated (prefix with - to un-skip, blank to leave as is): ")).trim();
    for (const entry of answer.split(",").map((e) => e.trim()).filter(Boolean)) {
      const name = entry.replace(/^-/, "");
      await FileManager.setProblemSkipped(name, !entry.startsWith("-"));
      Logger.success(`${entry.startsWith("-") ? "[UNSKIPPED]" : "[SKIPPED]"}\t\t\t:${name}`);
    }
  }

  static async solveDailyChallenge() {
    Logger.error('<<<< Starting Leetcoder Daily Challenge Solver >>>>');
    
    // Fetch daily challenge from LeetCode GraphQL API
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query questionOfToday {
            activeDailyCodingChallengeQuestion {
              question {
                titleSlug
              }
            }
          }
        `
      })
    });
    const result = await response.json();
    const problemName = result?.data?.activeDailyCodingChallengeQuestion?.question?.titleSlug;
    if (!problemName) throw new Error(`Could not read today's daily challenge: ${JSON.stringify(result).slice(0, 200)}`);
    
    Logger.success(`[DAILY_CHALLENGE]\t\t: ${problemName}`);
    
    const javaProblemNames = await FileManager.getAllProblemsNames();
    if (!javaProblemNames.includes(problemName)) {
      Logger.warn(`[NO_JAVA_SOLUTION]\t\t:${problemName}. Skipping daily challenge.`);
      Logger.error('<<<< Exiting Leetcoder Daily Challenge Solver >>>>');
      return;
    }

    if (await this.#shouldAttempt(problemName)) {
      await this.preflight();
      await this.#solveProblemWithName(problemName);
    }
    
    Logger.error('<<<< Exiting Leetcoder Daily Challenge Solver >>>>');
  }
}

export default LeetcoderSolver;
