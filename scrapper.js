import clipboardy from "clipboardy";
import fs from "fs-extra";
import chalk from "chalk";
import { getElementBySelector, getElementByXPath, sleep } from "./utils.js";
import {
  SCRAPPER_SUBMITTED_CODE_DIV_XPATH,
  SCRAPPER_SUBMITTED_CODE_LANGUAGE_XPATH,
  SCRAPPER_SUBMITTED_CODE_NAME_XPATH,
} from "./constants.js";

const scrapeAndSaveCodeFromSubmissionId = async (page, id, data_path) => {
  try {
    await page.goto(`https://leetcode.com/submissions/detail/${id}/`, {
      waitUntil: "networkidle2",
    });

    // Get name from the link in the name href
    const nameDiv = await getElementByXPath(page, SCRAPPER_SUBMITTED_CODE_NAME_XPATH, 3, 0);
    const hrefHandle = await nameDiv[0].getProperty("href");
    const href = await hrefHandle.jsonValue();
    const arr = await href.split("/");
    const nameDivValue = arr[arr.length - 2];

    // Get the language from the submission page
    const languageDiv = await getElementByXPath(page, SCRAPPER_SUBMITTED_CODE_LANGUAGE_XPATH, 3, 0);
    const languageDivValue = await languageDiv[0].evaluate((el) => el.textContent);

    // Get Code from the code  div
    const codeDiv = await getElementByXPath(page, SCRAPPER_SUBMITTED_CODE_DIV_XPATH, 3, 0);
    await codeDiv[0].click();

    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");

    await page.keyboard.down("Control");
    await page.keyboard.press("KeyC");
    await page.keyboard.up("Control");

    const copiedText = clipboardy.readSync();
    var fileContent = { problemName: nameDivValue, language: languageDivValue, code: copiedText };

    // Saving the scraped details
    const directory_path = `${data_path}/leetcoderData/accepted_solutions`;
    const filePath = `${directory_path}/${nameDivValue}.json`;

    // Ensure the directory structure exists, creating directories if they don't.
    fs.ensureDirSync(directory_path);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fileContent));
      console.log(chalk.green(`Code ${nameDivValue} saved`));
    } else {
      console.log(chalk.yellow(`Code ${nameDivValue} already exists`));
    }
  } catch (e) {
    console.error(chalk.red(e));
  }
};

const scrapeSubmissionIdsFromPageId = async (page, id) => {
  await page.goto(`https://leetcode.com/submissions/#/${id}`, {
    waitUntil: "networkidle2",
  });

  var rows = [];
  try {
    rows = await getElementBySelector(page, ".text-success", 10, 0);
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
};
const scrapeCodeFromAllSubmissions = async (page, data_path) => {
  for (var page_no = 1; page_no <= 1000; page_no++) {
    try {
      const submission_ids = await scrapeSubmissionIdsFromPageId(page, page_no);
      console.log(`Submission ids fetched from page number ${page_no}`, submission_ids);
      for (var idx = 0; idx < submission_ids.length; idx++) {
        await scrapeAndSaveCodeFromSubmissionId(page, submission_ids[idx], data_path);
      }
    } catch (e) {
      console.error(chalk.red(e + "\nMost likely invalid page id"));
      return;
    }
  }
};

export const scrapeAllAcceptedSubmissions = async (page, data_path) => {
  console.log(chalk.red("\n<<<< Starting Solution Scrapper >>>>\n"));
  await scrapeCodeFromAllSubmissions(page, data_path);
  console.log(chalk.red("\n<<<< Exiting Solution Scrapper >>>>\n"));
};
