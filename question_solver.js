import fs from "fs";
import { getElementByXPath, sleep } from "./utils.js";
import { QUESTIONS_CODE_DIV_XPATH, QUESTIONS_SUBMIT_ACCEPTED_XPATH, QUESTIONS_SUBMIT_DIV_XPATH } from "./constants.js";
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
    await getElementByXPath(page, QUESTIONS_SUBMIT_ACCEPTED_XPATH, 2);
    console.log(`${problem} is already SOLVED!`);
  } catch (e) {
    console.log(`Solving ${problem} ......`);

    //
    const content = fs.readFileSync(`./problems/${problem_name}`);
    const code = JSON.parse(content).code;
    // Copy code to clipboard
    clipboardy.writeSync(code);

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
    await sleep(15);
  }
};

export const solve_questions = async (page) => {
  const problems_names = await getFiles("./problems");
  for (var i = 0; i < problems_names.length; i++) {
    await solveProblemWithName(page, problems_names[i]);
  }
};
