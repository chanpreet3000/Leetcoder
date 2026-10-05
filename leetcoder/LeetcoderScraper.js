import clipboardy from "clipboardy";
import {copyHelper, getElementBySelector, getElementByXPath, selectAllHelper, sleep} from "../utils/utils.js";
import {
  SCRAPER_SUBMITTED_CODE_DIV_XPATH,
  SCRAPER_SUBMITTED_CODE_LANGUAGE_XPATH,
  SCRAPER_SUBMITTED_CODE_NAME_XPATH,
} from "../utils/constants.js";
import Logger from "../utils/Logger.js";
import {getBrowserDetails} from "../managers/BrowserManager.js";
import FileManager from "../managers/FileManager.js";

class LeetcoderScraper {
  static async #extractSubmittedCodeFromDom(page) {
    await page.waitForSelector('pre code, .view-lines, .CodeMirror-code', {timeout: 10000});
    const code = await page.evaluate(() => {
      const preCode = document.querySelector('pre code');
      if (preCode && preCode.textContent) {
        return preCode.textContent;
      }

      const monacoLines = Array.from(document.querySelectorAll('.view-lines .view-line'));
      if (monacoLines.length > 0) {
        return monacoLines.map((line) => line.textContent || '').join('\n');
      }

      const codeMirrorLines = Array.from(document.querySelectorAll('.CodeMirror-code > div'));
      if (codeMirrorLines.length > 0) {
        return codeMirrorLines
          .map((line) => Array.from(line.querySelectorAll('span')).map((span) => span.textContent || '').join(''))
          .join('\n');
      }

      return '';
    });

    return code.replace(/\r\n/g, '\n').replace(/\u200b/g, '').trimEnd();
  }

  static #isCodeReadable(code) {
    if (typeof code !== 'string' || code.trim().length === 0) {
      return false;
    }
    const nonPrintable = code.match(/[\x00-\x08\x0E-\x1F\x7F]/g);
    return !nonPrintable || nonPrintable.length < 3;
  }

  static async #scrapeAndSaveCodeFromSubmissionId(id) {
    const {browser} = await getBrowserDetails();
    const page = await browser.newPage();

    try {
      await page.goto(`https://leetcode.com/submissions/detail/${id}/`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      const statusDiv = await getElementByXPath(page, "//*[@id='result_state']", 3, 0);
      const textContent = await statusDiv[0].evaluate((el) => el.textContent);
      if (textContent !== 'Accepted') return;

      // Get name from the link in the name href
      const nameDiv = await getElementByXPath(page, SCRAPER_SUBMITTED_CODE_NAME_XPATH, 3, 0);
      const hrefHandle = await nameDiv[0].getProperty("href");
      const href = await hrefHandle.jsonValue();
      const arr = await href.split("/");
      const nameDivValue = arr[arr.length - 2];

      // Get the language from the submission page
      const languageDiv = await getElementByXPath(page, SCRAPER_SUBMITTED_CODE_LANGUAGE_XPATH, 3, 0);
      const languageDivValue = await languageDiv[0].evaluate((el) => el.textContent);

      let copiedText = await this.#extractSubmittedCodeFromDom(page);
      if (!this.#isCodeReadable(copiedText)) {
        Logger.warn(`[SCRAPER_FALLBACK_CLIPBOARD]\t:${nameDivValue}`);
        const codeDiv = await getElementByXPath(page, SCRAPER_SUBMITTED_CODE_DIV_XPATH, 3, 0);
        await codeDiv[0].click();
        await selectAllHelper(page);
        await copyHelper(page);
        copiedText = clipboardy.readSync().replace(/\r\n/g, '\n').trimEnd();
      }

      if (!this.#isCodeReadable(copiedText)) {
        throw new Error(`Unable to capture readable code for ${nameDivValue} (submission ${id}).`);
      }

      let fileContent = {problemName: nameDivValue, language: languageDivValue, code: copiedText};
      await FileManager.saveScrapedSolution(fileContent);
    } catch (err) {
      Logger.error('Something went wrong!', err);
    } finally {
      await page.close();
    }
  }

  static async #scrapeSubmissionIdsFromPageId(id) {
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

  static async #scrapeCodeFromAllSubmissions(browser) {
    for (let page_no = 1; page_no <= 1000; page_no++) {
      try {
        const submission_ids = await this.#scrapeSubmissionIdsFromPageId(page_no, browser);
        Logger.success(`Submission ids fetched from page number ${page_no}`, submission_ids);

        const promises = [];
        for (let idx = 0; idx < submission_ids.length; idx++) {
          promises.push(this.#scrapeAndSaveCodeFromSubmissionId(submission_ids[idx], browser));
        }
        await Promise.all(promises);
        promises.length = 0;
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

  /**
   * This is only for testing and scraping global solutions not relevant to the users.
   */
  static async scrapeAcceptedSolutionsGlobally() {
    Logger.error('<<<< Starting Leetcoder Scrapper >>>>');
    const {browser} = getBrowserDetails();
    try {
      let id_no = 1010011580
      while (id_no > 0) {
        const promises = [];
        for (let idx = 0; idx < 30; idx++) {
          promises.push(this.#scrapeAndSaveCodeFromSubmissionId(id_no, browser));
          id_no++;
        }
        await Promise.all(promises);
        await sleep(3)
        Logger.warn('LAST FETCHED IS ', id_no);
        promises.length = 0;
      }
    } catch (e) {
      Logger.error(e);
    }
    Logger.error('<<<< Exiting Leetcoder Scrapper >>>>');
  }
}

export default LeetcoderScraper;
