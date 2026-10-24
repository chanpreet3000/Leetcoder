import puppeteer from 'puppeteer';
import Logger from "../utils/Logger.js";
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
        protocolTimeout: 120000, // a wedged tab fails the current step instead of hanging the run forever
        args: [
          "--start-maximized",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
        ],
      });

      [BrowserManager.page] = await BrowserManager.browser.pages();
    }
  }

  static async getBrowserDetails() {
    if (BrowserManager.browser && !BrowserManager.browser.isConnected()) {
      Logger.warn('[BROWSER_LOST]\t\t:Chrome disconnected, relaunching it');
      // a disconnected Chrome can still be running and holding the profile lock, which makes the relaunch fail
      const proc = BrowserManager.browser.process();
      if (proc && proc.exitCode === null && proc.signalCode === null) {
        const exited = new Promise((resolve) => proc.once('exit', resolve));
        proc.kill('SIGKILL');
        await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 10000))]);
      }
      BrowserManager.browser = BrowserManager.page = null;
    }
    if (!BrowserManager.browser) {
      await BrowserManager.init();
    }
    if (BrowserManager.page.isClosed()) {
      BrowserManager.page = await BrowserManager.browser.newPage();
    }
    return { page: BrowserManager.page, browser: BrowserManager.browser };
  }

  static async closeBrowser() {
    if (BrowserManager.browser) {
      await BrowserManager.browser.close().catch(() => {});
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