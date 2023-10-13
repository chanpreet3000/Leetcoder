import dotenv from "dotenv";
dotenv.config();
// add stealth plugin and use defaults (all evasion techniques)
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
import { scrap } from "./scrapper.js";
import { solve_questions } from "./question_solver.js";
import { loginUser } from "./login.js";


export const start = async (user) => {
  console.log("<<<< Starting Leetcode Questions Solver Bot >>>>");

  // browser settings
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: process.env.GOOGLE_CHROME_DIRECTORY,
    userDataDir: `./chrome_profiles/${user.email}`,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const [page] = await browser.pages();

  await loginUser(page, user);
  await scrap(page);
  // await solve_questions(page);
  console.log("<<<< Exiting Leetcode Questions Solver Bot >>>>");
  // await browser.close();
  // process.exit();
};
