import fs from "fs";
import { getElementBySelector, getElementByXPath, sleep } from "./utils.js";
import {
  QUESTIONS_CODE_DIV_XPATH,
  QUESTIONS_LANGUAGE_BTN_XPATH,
  QUESTIONS_LANGUAGE_DIV_XPATH,
  QUESTIONS_SUBMIT_ACCEPTED_XPATH,
  QUESTIONS_SUBMIT_DIV_XPATH,
} from "./constants.js";
import clipboardy from "clipboardy";

const getFiles = async (dir, files = []) => {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) files.push(`${file}`);
  return files;
};

const solveProblemWithName = async (page, problem_name) => {
  const problem = problem_name.split(".")[0];
  await page.goto(`https://leetcode.com/problems/${problem}`, {
    waitUntil: "networkidle2",
  });

  try {
    const acceptedDiv = await getElementByXPath(page, QUESTIONS_SUBMIT_ACCEPTED_XPATH, 2);
    const classList = await acceptedDiv[0].evaluate((ele) => ele.classList.toString());
    if (classList.includes("dark:text-dark-green-s")) {
      console.log(`${problem} is already SOLVED!`);
      return;
    }

    console.log(`Solving ${problem} ......`);
    const content = fs.readFileSync(`./problems/${problem_name}`);
    const code = JSON.parse(content).code;
    const language = JSON.parse(content).language;
    // Copy code to clipboard
    clipboardy.writeSync(code);

    //Change the language to the code language
    const allLanguagesBtn = await getElementByXPath(page, QUESTIONS_LANGUAGE_BTN_XPATH, 5, 0);
    await allLanguagesBtn[0].click();

    const allLanguagesDiv = await getElementByXPath(page, QUESTIONS_LANGUAGE_DIV_XPATH, 5, 0);
    const allLanguagesDivName = await getElementBySelector(allLanguagesDiv[0], "li > div > div");

    for (let index = 0; index < allLanguagesDivName.length; index++) {
      const element = allLanguagesDivName[index];
      const text = await element.evaluate((el) => el.textContent);
      var b = false;
      if (text == "C++" && language == "cpp") {
        b = true;
      } else if (text == "Java" && language == "java") {
        b = true;
      } else if (text == "Python" && language == "python") {
        b = true;
      } else if (text == "Python3" && language == "python3") {
        b = true;
      } else if (text == "MySQL" && language == "mysql") {
        b = true;
      }
      if (b) {
        await element.click();
        break;
      }
    }

    await sleep(1);

    // Focus on the code editor
    const code_editor = await getElementByXPath(page, QUESTIONS_CODE_DIV_XPATH, 5, 0);
    await code_editor[0].click();

    // Select all code to remove
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    // Press Backspace
    await page.keyboard.press("Backspace");
    // Paste the code in the editor
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyV");
    await page.keyboard.up("Control");

    const submit_btn = await getElementByXPath(page, QUESTIONS_SUBMIT_DIV_XPATH, 5, 0);
    await submit_btn[0].click();
    await sleep(10);
  } catch (e) {
    console.error(`Failed to solved the question ${problem} with error ${e}`);
  }
};

export const solve_questions = async (page) => {
  console.log("<<<< Starting Solving all available solutions >>>>");
  const problems_names = await getFiles("./problems");
  for (var i = 0; i < problems_names.length; i++) {
    await solveProblemWithName(page, problems_names[i]);
  }
  console.log("<<<< Exiting Solving all available solutions >>>>");
};
