import dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import { scrapeAllAcceptedSubmissions } from "./scrapper.js";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { solve_questions } from "./question_solver.js";
import { loginUser } from "./login.js";

puppeteer.use(StealthPlugin());

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
  console.log(leetcoderASCII);
  console.log("<<<< Starting Leetcoder >>>>");

  try {
    const data_path = `./user_data/${user.email}`;
    // browser settings
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: process.env.GOOGLE_CHROME_EXECUTABLE_PATH,
      userDataDir: data_path,
      defaultViewport: null,
      args: ["--start-maximized"],
    });

    const [page] = await browser.pages();

    await loginUser(page, user, data_path);
    if (user.scrape_accepted_solutions) {
      await scrapeAllAcceptedSubmissions(page);
    }
    if (user.solve_solutions) {
      await solve_questions(page);
    }
  } catch (e) {
    console.error("Something went wrong ", e);
  }

  console.log("<<<< Exiting Leetcoder >>>>");
  await browser.close();
  process.exit();
};
