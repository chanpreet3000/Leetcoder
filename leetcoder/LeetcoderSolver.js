import {getElementByXPath, pasteHelper, selectAllHelper, sleep} from "../utils/utils.js";
import {
  IS_QUESTION_PREMIUM,
  IS_SOLUTION_ACCEPTED_DIV_XPATH,
  LANGUAGE_DISPLAY_MAP,
  QUESTIONS_CODE_DIV_XPATH,
  QUESTIONS_LANGUAGE_BTN_XPATH,
  QUESTIONS_LANGUAGE_DIV_XPATH,
  QUESTIONS_SUBMIT_ACCEPTED_XPATH,
  QUESTIONS_SUBMIT_DIV_XPATH,
} from "../utils/constants.js";
import clipboardy from "clipboardy";
import Logger from "../utils/Logger.js";
import FileManager from "../managers/FileManager.js";
import {getBrowserDetails} from "../managers/BrowserManager.js";

class LeetcoderSolver {
  static async #checkIfSolvedEarlier(problemName) {
    const solvedProblemSet = await FileManager.getSolvedProblemSet()
    return solvedProblemSet.has(problemName);
  }

  static async #solveProblemWithName(problemName) {
    Logger.warn(`[NAVIGATING]\t\t\t:${problemName}`);
    const {page} = await getBrowserDetails();
    await page.goto(`https://leetcode.com/problems/${problemName}`, {
      waitUntil: "networkidle2",
    });

    try {
      try {
        const acceptedDiv = await getElementByXPath(page, QUESTIONS_SUBMIT_ACCEPTED_XPATH, 4);
        const acceptedText = await acceptedDiv[0].evaluate((ele) => ele.textContent);
        if (acceptedText.includes("Solved")) {
          Logger.error(`[ALREADY_SOLVED]\t\t:${problemName}`);
          await FileManager.setSolvedProblemSet(problemName);
          return;
        }
      } catch (_) {
      }

      try {
        const acceptedDiv = await getElementByXPath(page, IS_QUESTION_PREMIUM, 1, 0.1);
        const acceptedText = await acceptedDiv[0].evaluate((ele) => ele.textContent);
        if (acceptedText.includes("Subscribe")) {
          Logger.error(`[PREMIUM_QUESTION]\t\t:${problemName}. Marking this as solved.`);
          await FileManager.setSolvedProblemSet(problemName);
          return;
        }
      } catch (_) {
      }

      Logger.success(`[SOLVING]\t\t\t:${problemName}`);

      const {code, language} = await FileManager.getProblemDetails(problemName);
      Logger.warn(`[LOADED_SOLUTION]\t\t:${problemName} (language: ${language}, ${code.length} chars)`);

      // Copy code to clipboard
      clipboardy.writeSync(code);

      //Change the language to the code language
      Logger.warn(`[SWITCHING_LANGUAGE]\t\t:${language}`);
      const targetLabel = LANGUAGE_DISPLAY_MAP[language];
      if (!targetLabel) {
        throw new Error(`Unsupported language "${language}" for ${problemName}. Add it to LANGUAGE_DISPLAY_MAP in utils/constants.js.`);
      }

      const allLanguagesBtn = await getElementByXPath(page, QUESTIONS_LANGUAGE_BTN_XPATH, 5, 0);
      await allLanguagesBtn[0].click();

      const allLanguagesDivName = await getElementByXPath(page, QUESTIONS_LANGUAGE_DIV_XPATH, 5, 0);
      let languageSelected = false;
      for (let index = 0; index < allLanguagesDivName.length; index++) {
        const element = allLanguagesDivName[index];
        const text = await element.evaluate((el) => el.textContent);
        if (text.trim() === targetLabel) {
          await element.click();
          languageSelected = true;
          break;
        }
      }
      if (!languageSelected) {
        throw new Error(`Language "${targetLabel}" (${language}) was not found in the editor dropdown for ${problemName}.`);
      }

      await sleep(1);

      // Focus on the code editor
      const code_editor = await getElementByXPath(page, QUESTIONS_CODE_DIV_XPATH, 5, 0);
      await code_editor[0].click();

      // Select all code to remove
      await selectAllHelper(page);
      // Press Backspace
      await page.keyboard.press("Backspace");
      // Paste the code in the editor
      await pasteHelper(page);

      Logger.warn(`[SUBMITTING]\t\t\t:${problemName}`);
      const submit_btn = await getElementByXPath(page, QUESTIONS_SUBMIT_DIV_XPATH, 5, 0);
      await submit_btn[0].click();

      Logger.warn(`[AWAITING_VERDICT]\t\t:${problemName}`);
      const isSolutionAccepted = await getElementByXPath(page, IS_SOLUTION_ACCEPTED_DIV_XPATH, 15, 0);
      const solutionAcceptedText = await isSolutionAccepted[0].evaluate((ele) => ele.textContent);

      if (solutionAcceptedText === 'Accepted') {
        Logger.success(`[ACCEPTED]\t\t\t:${problemName}`);
        await FileManager.setSolvedProblemSet(problemName);
      } else {
        throw new Error(`${problemName} ${solutionAcceptedText}. Looks like the solution is old, contact the developer to fix this.`);
      }
      await sleep(1);
    } catch (err) {
      Logger.error(`[FAILED]\t\t: Failed to solve the ${problemName} problem with error`, err);
    }
  }

  static async #solveProblems(problemNames) {
    for (const problemName of problemNames) {
      const checkIfSolved = await this.#checkIfSolvedEarlier(problemName);
      if (!checkIfSolved) {
        await this.#solveProblemWithName(problemName);
      } else {
        Logger.success(`[SOLVED_EARLIER]\t\t:${problemName}`);
      }
    }
  }

  static async solve() {
    Logger.error('<<<< Starting Leetcoder Solver >>>>');
    const allProblemsName = await FileManager.getAllProblemsNames();
    Logger.success(`[QUEUED]\t\t\t:${allProblemsName.length} problems to process`);
    await this.#solveProblems(allProblemsName);
    Logger.error('<<<< Exiting Leetcoder Solver >>>>');
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
    const problemName = result.data.activeDailyCodingChallengeQuestion.question.titleSlug;
    
    Logger.success(`[DAILY_CHALLENGE]\t\t: ${problemName}`);
    
    const checkIfSolved = await this.#checkIfSolvedEarlier(problemName);
    if (!checkIfSolved) {
      await this.#solveProblemWithName(problemName);
    } else {
      Logger.success(`[SOLVED_EARLIER]\t\t:${problemName}`);
    }
    
    Logger.error('<<<< Exiting Leetcoder Daily Challenge Solver >>>>');
  }
}

export default LeetcoderSolver;

