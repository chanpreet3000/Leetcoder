import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer";
import { scrapeAllAcceptedSubmissions } from "./scrapper.js";
import QuestionSolver from "./question_solver.js";
import { loginUser } from "./login.js";
import chalk from "chalk";

const leetcoderASCII = `
     _                    _                _           
    | |                  | |              | |          
    | |     ___  ___  ___| |_ ___ ___   __| | ___ _ __ 
    | |    / _ \\/ _ \\/ _ \\ __/ __/ _ \\ / _| |/ _ \\  __|
    | |___|  __/  __/  __/ || (_| (_) | (_| |  __/ |   
    \\_____/\\___|\\___|\\___|\\__\\___\\___/ \\__,_|\\___|_|
    
    Developed by : Chanpreet Singh, Aryan Singh, Himanshu Upreti
    Github Link : https://github.com/chanpreet3000/leetcode-bot
    `;

export const start = async (user) => {
  console.log(chalk.green(leetcoderASCII));
  console.log(chalk.red("\n<<<< Starting Leetcoder >>>>\n"));

  const chromeDataPath = `./UserData/${user.email}/ProfileData`;
  // browser settings
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: process.env.GOOGLE_CHROME_EXECUTABLE_PATH,
    userDataDir: chromeDataPath,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const [page] = await browser.pages();

  const userDataPath = `./UserData/${user.email}/LeetCodeData`;
  try {
    await loginUser(page, user);
    if (user.scrape_accepted_solutions) {
      await scrapeAllAcceptedSubmissions(page, userDataPath);
    }
    if (user.solve_solutions) {
      const questionSolver = new QuestionSolver(page, userDataPath);
      await questionSolver.solve();
    }
  } catch (e) {
    console.error(chalk.red("Something went wrong ", e.stack));
  }

  console.log(chalk.red("\n<<<< Exiting Leetcoder >>>>\n"));
  await browser.close();
  process.exit();
};
