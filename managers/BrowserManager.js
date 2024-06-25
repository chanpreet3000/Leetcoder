import puppeteer from 'puppeteer';
import {CHROME_PROFILE_PATH, GOOGLE_CHROME_EXECUTABLE_PATH} from "../data.js";


class BrowserManager {
  static browser = null;
  static page = null;

  static async init() {
    if (!BrowserManager.browser) {
      BrowserManager.browser = await puppeteer.launch({
        headless: false,
        executablePath: GOOGLE_CHROME_EXECUTABLE_PATH,
        userDataDir: CHROME_PROFILE_PATH,
        defaultViewport: null,
        args: ["--start-maximized"],
      });

      [BrowserManager.page] = await BrowserManager.browser.pages();
    }
  }

  static async getBrowserDetails() {
    if (!BrowserManager.browser || !BrowserManager.page) {
      await BrowserManager.init();
    }
    return { page: BrowserManager.page, browser: BrowserManager.browser };
  }

  static async closeBrowser() {
    if (BrowserManager.browser) {
      await BrowserManager.browser.close();
      BrowserManager.browser = null;
      BrowserManager.page = null;
    }
  }
}

export const getBrowserDetails = async () => {
  return await BrowserManager.getBrowserDetails();
};

export const closeBrowser = async () => {
  return await BrowserManager.closeBrowser();
};