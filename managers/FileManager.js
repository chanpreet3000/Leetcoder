import {promises as fs} from "fs";
import {FAILED_PROBLEMS_PATH, LEETCODER_DATA_PATH, LEETCODER_SCRAPED_SOLUTIONS_PATH, SOLVED_PROBLEMS_PATH} from "../data.js";
import Logger from "../utils/Logger.js";
import path from 'path';

// Write to a temp file and rename it over the target, so a crash mid-write never leaves a truncated JSON file behind.
const writeJsonAtomic = async (file, data, indent) => {
  await fs.writeFile(`${file}.tmp`, JSON.stringify(data, null, indent));
  await fs.rename(`${file}.tmp`, file);
};

class FileManager {
  static async getAllProblemsNames() {
    const fileList = await fs.readdir('./problems');
    const files = [];

    for (const file of fileList) {
      if (path.extname(file) !== '.json') {
        continue;
      }

      const problemName = path.basename(file, '.json');
      const data = JSON.parse(await fs.readFile(path.join('./problems', file), 'utf-8'));
      if (data.language === 'java' && typeof data.code === 'string' && data.code.trim().length > 0) {
        files.push(problemName);
      }
    }

    Logger.success(`Total Java solutions found ${files.length}`, files);
    return files;
  }

  static async getProblemDetails(problemName) {
    const file = await fs.readFile(`./problems/${problemName}.json`, 'utf-8');
    const data = JSON.parse(file);
    return {language: data.language, code: data.code};
  }

  static async #ensureSolvedProblemSetFile() {
    try {
      await fs.access(SOLVED_PROBLEMS_PATH);
    } catch (_) {
      Logger.warn(`${SOLVED_PROBLEMS_PATH} was not found, created the file.`)
      await fs.mkdir(LEETCODER_DATA_PATH, {recursive: true});
      await writeJsonAtomic(SOLVED_PROBLEMS_PATH, []);
    }
  }

  static async getSolvedProblemSet() {
    await this.#ensureSolvedProblemSetFile();
    const data = await fs.readFile(SOLVED_PROBLEMS_PATH, 'utf8');
    return new Set(JSON.parse(data))
  }

  static async setSolvedProblemSet(problemName) {
    const problemSet = await this.getSolvedProblemSet();
    problemSet.add(problemName);
    Logger.success(`[CACHED]\t\t\t:${problemName}`)
    await writeJsonAtomic(SOLVED_PROBLEMS_PATH, Array.from(problemSet));
  }

  // status: 'failed' | 'skipped'. One entry per problem (latest run wins); status null clears it.
  static getProblemIssues() {
    return fs.readFile(FAILED_PROBLEMS_PATH, 'utf8').then(JSON.parse, () => ({}));
  }

  static async recordProblemIssue(problemName, status, reason, extra = {}) {
    const issues = await this.getProblemIssues();
    if (status) {
      issues[problemName] = {status, ...extra, reason: String(reason), at: new Date().toISOString()};
    } else if (problemName in issues) {
      delete issues[problemName];
    } else {
      return;
    }
    await fs.mkdir(LEETCODER_DATA_PATH, {recursive: true});
    await writeJsonAtomic(FAILED_PROBLEMS_PATH, issues, 2);
  }

  // skip: true means the user gave up on this problem; the solver leaves it alone until they un-skip it.
  static async setProblemSkipped(problemName, skip) {
    const issues = await this.getProblemIssues();
    if (skip) {
      issues[problemName] = {...(issues[problemName] ?? {status: 'skipped', reason: 'skipped by you'}), skip: true};
    } else if (issues[problemName]?.reason === 'skipped by you') {
      delete issues[problemName];
    } else if (issues[problemName]) {
      delete issues[problemName].skip;
    }
    await fs.mkdir(LEETCODER_DATA_PATH, {recursive: true});
    await writeJsonAtomic(FAILED_PROBLEMS_PATH, issues, 2);
  }

  // Screenshot + HTML of the page at the moment a UI step failed, so a LeetCode layout change can be diagnosed later.
  static async saveFailureArtifacts(problemName, page) {
    const dir = path.join(LEETCODER_DATA_PATH, 'failures');
    await fs.mkdir(dir, {recursive: true});
    await page.screenshot({path: path.join(dir, `${problemName}.png`)});
    await fs.writeFile(path.join(dir, `${problemName}.html`), await page.content());
  }

  static async saveScrapedSolution(fileContent) {
    const name = fileContent.problemName;
    await fs.mkdir(LEETCODER_SCRAPED_SOLUTIONS_PATH, {recursive: true});
    const filePath = path.join(LEETCODER_SCRAPED_SOLUTIONS_PATH, `${name}.json`);

    try {
      await fs.access(filePath);
      Logger.warn(`[ALREADY_SCRAPPED]\t\t:${name}`);
    } catch (error) {
      Logger.warn(`[SAVING]\t\t\t:${name}`);
      try {
        await fs.writeFile(filePath, JSON.stringify(fileContent, null, 4));
        Logger.success(`[SAVED]\t\t\t\t:${name}`);
      } catch (err) {
        Logger.success(`[FAILED]\t\t\t:${name}`, err);
      }
    }
  }
}

export default FileManager;