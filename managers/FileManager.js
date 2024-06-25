import {promises as fs} from "fs";
import {LEETCODER_DATA_PATH, LEETCODER_SCRAPED_SOLUTIONS_PATH, SOLVED_PROBLEMS_PATH} from "../data.js";
import Logger from "../utils/Logger.js";
import path from 'path';

class FileManager {
  static async getAllProblemsNames() {
    const fileList = await fs.readdir('./problems');
    const files = fileList.map(file => file.split(".")[0]);
    Logger.success(`Total Problems found ${files.length}`, files);
    return files;
  }

  static async getProblemDetails(problemName) {
    const file = await fs.readFile(`./problems/${problemName}.json`, 'utf-8');
    const data = JSON.parse(file);
    const obj = {language: data.language, code: data.code};
    Logger.warn(`[PROBLEM_DETAILS]\t\t:`, obj);
    return obj;
  }

  static async #ensureSolvedProblemSetFile() {
    try {
      await fs.access(SOLVED_PROBLEMS_PATH);
    } catch (_) {
      Logger.warn(`${SOLVED_PROBLEMS_PATH} was not found, created the file.`)
      await fs.mkdir(LEETCODER_DATA_PATH, {recursive: true});
      await fs.writeFile(SOLVED_PROBLEMS_PATH, JSON.stringify([]));
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
    await fs.writeFile(SOLVED_PROBLEMS_PATH, JSON.stringify(Array.from(problemSet)));
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