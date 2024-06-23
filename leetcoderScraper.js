import clipboardy from "clipboardy";
import fs from "fs-extra";
import {copyHelper, getElementBySelector, getElementByXPath, selectAllHelper} from "./utils.js";
import {
  SCRAPER_SUBMITTED_CODE_DIV_XPATH,
  SCRAPER_SUBMITTED_CODE_LANGUAGE_XPATH,
  SCRAPER_SUBMITTED_CODE_NAME_XPATH,
} from "./constants.js";
import {LEETCODE_DATA_PATH} from "./data.js";
import Logger from "./Logger.js";

class LeetcoderScraper {
  constructor(page) {
    this.page = page;
    this.acceptedSolutionDirectory = `${LEETCODE_DATA_PATH}/AcceptedSolutions`;
  }

  async scrapeAndSaveCodeFromSubmissionId(id) {
    try {
      await this.page.goto(`https://leetcode.com/submissions/detail/${id}/`, {
        waitUntil: "networkidle2",
      });

      // Get name from the link in the name href
      const nameDiv = await getElementByXPath(this.page, SCRAPER_SUBMITTED_CODE_NAME_XPATH, 3, 0);
      const hrefHandle = await nameDiv[0].getProperty("href");
      const href = await hrefHandle.jsonValue();
      const arr = await href.split("/");
      const nameDivValue = arr[arr.length - 2];

      // Get the language from the submission this.page
      const languageDiv = await getElementByXPath(this.page, SCRAPER_SUBMITTED_CODE_LANGUAGE_XPATH, 3, 0);
      const languageDivValue = await languageDiv[0].evaluate((el) => el.textContent);

      // Get Code from the code  div
      const codeDiv = await getElementByXPath(this.page, SCRAPER_SUBMITTED_CODE_DIV_XPATH, 3, 0);
      await codeDiv[0].click();

      await selectAllHelper(this.page);
      await copyHelper(this.page);

      const copiedText = clipboardy.readSync();
      let fileContent = {problemName: nameDivValue, language: languageDivValue, code: copiedText};

      // Ensure the directory structure exists, creating directories if they don't.
      fs.ensureDirSync(this.acceptedSolutionDirectory);

      // Saving the scraped details
      const filePath = `${this.acceptedSolutionDirectory}/${nameDivValue}.json`;
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(fileContent));
        Logger.success(`[SAVED] ${nameDivValue}`);
      } else {
        Logger.warn(`[EXISTS] ${nameDivValue}`);
      }
    } catch (err) {
      Logger.error('Something went wrong!', err);
    }
  }

  async scrapeSubmissionIdsFromPageId(id) {
    await this.page.goto(`https://leetcode.com/submissions/#/${id}`, {
      waitUntil: "networkidle2",
    });

    var rows = [];
    try {
      rows = await getElementBySelector(this.page, ".text-success", 10, 0);
    } catch (e) {
      rows = [];
    }
    const accepted_hrefs = await Promise.all(
      rows.map(async (row) => {
        return await row.evaluate((el) => el.getAttribute("href"));
      })
    );
    return await Promise.all(
      accepted_hrefs.map(async (href) => {
        const arr = await href.split("/");
        return arr[arr.length - 2];
      })
    );
  }

  async scrapeCodeFromAllSubmissions() {
    for (let page_no = 1; page_no <= 1000; page_no++) {
      try {
        const submission_ids = await this.scrapeSubmissionIdsFromPageId(page_no);
        Logger.success(`Submission ids fetched from page number ${page_no}`, submission_ids);
        for (let idx = 0; idx < submission_ids.length; idx++) {
          await this.scrapeAndSaveCodeFromSubmissionId(submission_ids[idx]);
        }
      } catch (err) {
        Logger.error('Something went wrong, Most Likely Invalid page id', err);
        return;
      }
    }
  }

  async scrapeAllAcceptedSubmissions() {
    await this.scrapeCodeFromAllSubmissions();
  }
}

export default LeetcoderScraper;
