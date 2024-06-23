import puppeteer from "puppeteer";
import {CHROME_PROFILE_PATH, GOOGLE_CHROME_EXECUTABLE_PATH} from "./data.js";

export const sleep = async (time) => {
  await new Promise((resolve) => setTimeout(resolve, time * 1000));
};

export const getElementByXPath = async (element, xpath, timeoutDelay = 30, delay = 1.3) => {
  await sleep(delay);
  await element.waitForXPath(xpath, {
    visible: true,
    timeout: timeoutDelay * 1000,
  });
  return await element.$x(xpath);
};

export const getElementBySelector = async (element, selector, timeoutDelay = 30, delay = 1.3) => {
  await sleep(delay);
  await element.waitForSelector(selector, {
    visible: true,
    timeout: timeoutDelay * 1000,
  });
  return await element.$$(selector);
};

let cntrlKey = process.platform === "win32" ? "Control" : "Meta";

export const selectAllHelper = async (page) => {
  await page.keyboard.down(cntrlKey);
  await page.keyboard.press("KeyA");
  await page.keyboard.up(cntrlKey);
};

export const copyHelper = async (page) => {
  await page.keyboard.down(cntrlKey);
  await page.keyboard.press("KeyC");
  await page.keyboard.up(cntrlKey);
};

export const pasteHelper = async (page) => {
  await page.keyboard.down(cntrlKey);
  await page.keyboard.press("KeyV");
  await page.keyboard.up(cntrlKey);
};

export const getPage = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: GOOGLE_CHROME_EXECUTABLE_PATH,
    userDataDir: CHROME_PROFILE_PATH,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const [page] = await browser.pages();
  return {page, browser};
}