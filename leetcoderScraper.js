import clipboardy from "clipboardy";
import {copyHelper, getElementBySelector, getElementByXPath, selectAllHelper} from "./utils/utils.js";
import {
  SCRAPER_SUBMITTED_CODE_DIV_XPATH,
  SCRAPER_SUBMITTED_CODE_LANGUAGE_XPATH,
  SCRAPER_SUBMITTED_CODE_NAME_XPATH,
} from "./constants.js";
import Logger from "./utils/Logger.js";
import {getBrowserDetails} from "./managers/BrowserManager.js";
import FileManager from "./managers/FileManager.js";

class LeetcoderScraper {
  static async #scrapeAndSaveCodeFromSubmissionId(id) {
    const {page} = getBrowserDetails();
    try {
      await page.goto(`https://leetcode.com/submissions/detail/${id}/`, {
        waitUntil: "networkidle2",
      });

      // Get name from the link in the name href
      const nameDiv = await getElementByXPath(page, SCRAPER_SUBMITTED_CODE_NAME_XPATH, 3, 0);
      const hrefHandle = await nameDiv[0].getProperty("href");
      const href = await hrefHandle.jsonValue();
      const arr = await href.split("/");
      const nameDivValue = arr[arr.length - 2];

      // Get the language from the submission page
      const languageDiv = await getElementByXPath(page, SCRAPER_SUBMITTED_CODE_LANGUAGE_XPATH, 3, 0);
      const languageDivValue = await languageDiv[0].evaluate((el) => el.textContent);

      // Get Code from the code  div
      const codeDiv = await getElementByXPath(page, SCRAPER_SUBMITTED_CODE_DIV_XPATH, 3, 0);
      await codeDiv[0].click();

      await selectAllHelper(page);
      await copyHelper(page);

      const copiedText = clipboardy.readSync();
      let fileContent = {problemName: nameDivValue, language: languageDivValue, code: copiedText};
      await FileManager.saveScrapedSolution(fileContent);
    } catch (err) {
      Logger.error('Something went wrong!', err);
    }
  }

  async #scrapeSubmissionIdsFromPageId(id) {
    const {page} = await getBrowserDetails();
    await page.goto(`https://leetcode.com/submissions/#/${id}`, {
      waitUntil: 'networkidle2',
    });

    let rows = [];
    try {
      rows = await getElementBySelector(page, '.text-success', 10, 0);
    } catch (_) {
    }

    return await Promise.all(rows.map(async row => {
      const href = await row.evaluate(el => el.getAttribute('href'));
      return href.split('/').slice(-2, -1)[0];
    }));
  }

  static async #scrapeCodeFromAllSubmissions() {
    for (let page_no = 1; page_no <= 1000; page_no++) {
      try {
        const submission_ids = await this.#scrapeSubmissionIdsFromPageId(page_no);
        Logger.success(`Submission ids fetched from page number ${page_no}`, submission_ids);
        for (let idx = 0; idx < submission_ids.length; idx++) {
          await this.#scrapeAndSaveCodeFromSubmissionId(submission_ids[idx]);
        }
      } catch (err) {
        Logger.error('Something went wrong, Most Likely Invalid page id', err);
        return;
      }
    }
  }

  static async scrapeAcceptedSolutions() {
    Logger.error('<<<< Starting Leetcoder Scrapper >>>>');
    await this.#scrapeCodeFromAllSubmissions();
    Logger.error('<<<< Exiting Leetcoder Scrapper >>>>');
  }
}

export default LeetcoderScraper;
