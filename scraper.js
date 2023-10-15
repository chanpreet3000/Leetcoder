import clipboardy from "clipboardy";
import fs from "fs-extra";
import chalk from "chalk";
import { copyHelper, getElementBySelector, getElementByXPath, selectAllHelper } from "./utils.js";
import {
  SCRAPER_SUBMITTED_CODE_DIV_XPATH,
  SCRAPER_SUBMITTED_CODE_LANGUAGE_XPATH,
  SCRAPER_SUBMITTED_CODE_NAME_XPATH,
} from "./constants.js";

export default class Scraper {
  constructor(page, userDataPath) {
    this.page = page;
    this.userDataPath = userDataPath;
    this.acceptedSolutionDirectory = `${userDataPath}/AcceptedSolutions`;
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
      var fileContent = { problemName: nameDivValue, language: languageDivValue, code: copiedText };

      // Ensure the directory structure exists, creating directories if they don't.
      fs.ensureDirSync(this.acceptedSolutionDirectory);
      
      // Saving the scraped details
      const filePath = `${this.acceptedSolutionDirectory}/${nameDivValue}.json`;
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(fileContent));
        console.log(chalk.green(`[SAVED] ${nameDivValue}`));
      } else {
        console.log(chalk.yellow(`[EXISTS] ${nameDivValue}`));
      }
    } catch (e) {
      console.error(chalk.red(e));
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
    const submission_ids = await Promise.all(
      accepted_hrefs.map(async (href) => {
        const arr = await href.split("/");
        return arr[arr.length - 2];
      })
    );
    return submission_ids;
  }

  async scrapeCodeFromAllSubmissions() {
    for (var page_no = 1; page_no <= 1000; page_no++) {
      try {
        const submission_ids = await this.scrapeSubmissionIdsFromPageId(page_no);
        console.log(`Submission ids fetched from page number ${page_no}`, submission_ids);
        for (var idx = 0; idx < submission_ids.length; idx++) {
          await this.scrapeAndSaveCodeFromSubmissionId(submission_ids[idx]);
        }
      } catch (e) {
        console.error(chalk.red(e, "\nMost likely invalid this.page id"));
        return;
      }
    }
  }

  async scrapeAllAcceptedSubmissions() {
    console.log(chalk.red("\n<<<< Starting Solution Scraper >>>>\n"));
    await this.scrapeCodeFromAllSubmissions();
    console.log(chalk.red("\n<<<< Exiting Solution Scraper >>>>\n"));
  }
}
