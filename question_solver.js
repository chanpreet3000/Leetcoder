import fs from "fs-extra";
import { getElementByXPath, pasteHelper, selectAllHelper, sleep } from "./utils.js";
import {
  IS_SOLUTION_ACCEPTED_DIV_XPATH,
  QUESTIONS_CODE_DIV_XPATH,
  QUESTIONS_LANGUAGE_BTN_XPATH,
  QUESTIONS_LANGUAGE_DIV_XPATH,
  QUESTIONS_SUBMIT_ACCEPTED_XPATH,
  QUESTIONS_SUBMIT_DIV_XPATH,
} from "./constants.js";
import clipboardy from "clipboardy";
import chalk from "chalk";

export default class QuestionSolver {
  constructor(page, userDataPath) {
    this.page = page;
    this.userDataPath = userDataPath;
    this.leetcodeDataDirectory = this.userDataPath;
    this.solvedProblemsFilePath = `${this.leetcodeDataDirectory}/SolvedProblems.json`;
    this.allProblemNames = [];
  }

  async getFileNames(dir, files = []) {
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
      files.push(file.split(".")[0]);
    }
    return files;
  }

  async checkIfSolvedEarlier(problemName) {
    const solvedProblemSet = await this.getSolvedProblemSet();
    return solvedProblemSet.has(problemName);
  }

  async setAProblemSolved(problemName) {
    const problemSet = await this.getSolvedProblemSet();
    problemSet.add(problemName);
    await this.setSolvedProblemSet(problemSet);
  }

  async setSolvedProblemSet(solvedProblemSet) {
    fs.ensureDirSync(this.leetcodeDataDirectory);

    const solvedProblemArray = Array.from(solvedProblemSet);
    const jsonSolvedProblems = JSON.stringify(solvedProblemArray);
    await fs.outputFile(this.solvedProblemsFilePath, jsonSolvedProblems, "utf-8");
  }

  async getSolvedProblemSet() {
    fs.ensureDirSync(this.leetcodeDataDirectory);

    var solvedProblemsArray = [];
    if (fs.existsSync(this.solvedProblemsFilePath)) {
      const data = await fs.readFile(this.solvedProblemsFilePath, "utf-8");
      solvedProblemsArray = await JSON.parse(data);
    } else {
      await this.setSolvedProblemSet(new Set());
    }
    return new Set(solvedProblemsArray);
  }

  async solveProblemWithName(problemName) {
    await this.page.goto(`https://leetcode.com/problems/${problemName}`, {
      waitUntil: "networkidle2",
    });

    try {
      try {
        const acceptedDiv = await getElementByXPath(this.page, QUESTIONS_SUBMIT_ACCEPTED_XPATH, 2);
        const acceptedText = await acceptedDiv[0].evaluate((ele) => ele.textContent);
        if (acceptedText.includes("Solved")) {
          console.log(chalk.red(`${problemName} is already SOLVED!`));
          await this.setAProblemSolved(problemName);
          return;
        }
      } catch (_) {
      }
      console.log(chalk.green(`Solving ${problemName} ......`));
      const content = fs.readFileSync(`./problems/${problemName}.json`);
      const code = JSON.parse(content).code;
      const language = JSON.parse(content).language;
      // Copy code to clipboard
      clipboardy.writeSync(code);

      //Change the language to the code language
      const allLanguagesBtn = await getElementByXPath(this.page, QUESTIONS_LANGUAGE_BTN_XPATH, 5, 0);
      await allLanguagesBtn[0].click();

      const allLanguagesDivName = await getElementByXPath(this.page, QUESTIONS_LANGUAGE_DIV_XPATH, 5, 0);
      for (let index = 0; index < allLanguagesDivName.length; index++) {
        const element = allLanguagesDivName[index];
        const text = await element.evaluate((el) => el.textContent);
        let b = false;
        if (text === "C++" && language === "cpp") {
          b = true;
        } else if (text === "Java" && language === "java") {
          b = true;
        } else if (text === "Python" && language === "python") {
          b = true;
        } else if (text === "Python3" && language === "python3") {
          b = true;
        } else if (text === "MySQL" && language === "mysql") {
          b = true;
        }
        if (b) {
          await element.click();
          break;
        }
      }

      await sleep(1);

      // Focus on the code editor
      const code_editor = await getElementByXPath(this.page, QUESTIONS_CODE_DIV_XPATH, 5, 0);
      await code_editor[0].click();

      // Select all code to remove
      await selectAllHelper(this.page);
      // Press Backspace
      await this.page.keyboard.press("Backspace");
      // Paste the code in the editor
      await pasteHelper(this.page);

      const submit_btn = await getElementByXPath(this.page, QUESTIONS_SUBMIT_DIV_XPATH, 5, 0);
      await submit_btn[0].click();

      const isSolutionAccepted = await getElementByXPath(this.page, IS_SOLUTION_ACCEPTED_DIV_XPATH, 15, 0);
      const solutionAcceptedText = await isSolutionAccepted[0].evaluate((ele) => ele.textContent);

      if(solutionAcceptedText === 'Accepted'){
        console.log(chalk.green(`${problemName} ACCEPTED`));
      }else{
        console.log(chalk.red(`${problemName} ${solutionAcceptedText}. Looks like the solution is old, contact the developer to fix this.`));
      }
      await sleep(1);
      await this.setAProblemSolved(problemName);
    } catch (e) {
      console.error(chalk.red(`Failed to solved the question ${problemName} with error ${e}`));
    }
  }

  async solveAllProblems() {
    for (var i = 0; i < this.allProblemNames.length; i++) {
      const checkIfSolved = await this.checkIfSolvedEarlier(this.allProblemNames[i]);
      if (!checkIfSolved) {
        await this.solveProblemWithName(this.allProblemNames[i]);
      } else {
        console.log(chalk.green(`${this.allProblemNames[i]} was solved earlier by the bot`));
      }
    }
  }

  async solve() {
    console.log(chalk.red("\n<<<< Starting Leetcode Code Solver >>>>\n"));
    this.allProblemNames = await this.getFileNames("./problems");
    await this.solveAllProblems();
    console.log(chalk.red("\n<<<< Exiting Leetcode Code Solver >>>>\n"));
  }
}
