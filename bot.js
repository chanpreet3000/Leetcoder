import dotenv from "dotenv";
dotenv.config();
// add stealth plugin and use defaults (all evasion techniques)
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
import { scrap } from "./scrapper.js";


// 
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

  // await page.goto("https://leetcode.com", {
  //   waitUntil: "networkidle2",
  // });
  await scrap(page);
  console.log("<<<< Exiting Leetcode Questions Solver Bot >>>>");
  await browser.close();
  process.exit();


  // // Check if login or not, if not login.
  // try {
  //   await getElementByXPath(page, XPATH_PROFILE_BUTTON, 3);
  //   await afterLogin(browser, page, user);
  // } catch (err) {
  //   console.log(err);
  //   //After it is logged in start the process.
  //   page.on("framenavigated", async (frame) => {
  //     const currentURL = await frame.evaluate(() => window.location.href);
  //     if (currentURL === "https://tinder.com/app/recs") await afterLogin(browser, page, user);
  //   });
  //   await login(user, page);
  // }
};
