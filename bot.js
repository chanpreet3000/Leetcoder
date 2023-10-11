// add stealth plugin and use defaults (all evasion techniques)
require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Replace by your user ID, you can find it in the network tab in the requests
async function login(user, page) {
  console.log("Logging in user...");
  try {
  } catch (err) {
    console.error("Login System Failed:", err);
  }
}
const afterLogin = async (browser, page, user) => {
  try {
  } catch (err) {
    console.error(err);
  } finally {
    console.log("<<<< Exiting Leetcode Questions Solver Bot >>>>");
    await browser.close();
    process.exit();
  }
};

const start = async (user) => {
  console.log("<<<< Starting Leetcode Questions Solver Bot >>>>");

  // browser settings
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: process.env.GOOGLE_CHROME_DIRECTORY,
    userDataDir: process.env.GOOGLE_CHROME_DATA_DIRECTORY + `/${user.phone_number}`,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const [page] = await browser.pages();

  await page.goto("https://leetcode.com", {
    waitUntil: "networkidle2",
  });

  // Check if login or not, if not login.
  try {
    await getElementByXPath(page, XPATH_PROFILE_BUTTON, 3);
    await afterLogin(browser, page, user);
  } catch (err) {
    console.log(err);
    //After it is logged in start the process.
    page.on("framenavigated", async (frame) => {
      const currentURL = await frame.evaluate(() => window.location.href);
      if (currentURL === "https://tinder.com/app/recs") await afterLogin(browser, page, user);
    });
    await login(user, page);
  }
};

module.exports = {
  start,
};
