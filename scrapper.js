import clipboardy from "clipboardy";
import fs from "fs";
import { getElementByXPath } from "./utils.js";
import {
  SCRAPPER_SUBMITTED_CODE_DIV_XPATH,
  SCRAPPER_SUBMITTED_CODE_LANGUAGE_XPATH,
  SCRAPPER_SUBMITTED_CODE_NAME_XPATH,
} from "./constants.js";

const scrapAndSaveCodeFromSubmissionId = async (page, id) => {
  try {
    await page.goto(`https://leetcode.com/submissions/detail/${id}/`, {
      waitUntil: "networkidle2",
    });

    // Get name from the link in the name href
    const nameDiv = await getElementByXPath(page, SCRAPPER_SUBMITTED_CODE_NAME_XPATH, 3);
    const hrefHandle = await nameDiv[0].getProperty("href");
    const href = await hrefHandle.jsonValue();
    const arr = await href.split("/");
    const nameDivValue = arr[arr.length - 2];

    // Get the language from the submission page
    const languageDiv = await getElementByXPath(page, SCRAPPER_SUBMITTED_CODE_LANGUAGE_XPATH, 3);
    const languageDivValue = await languageDiv[0].evaluate((el) => el.textContent);

    // Get Code from the code  div
    const codeDiv = await getElementByXPath(page, SCRAPPER_SUBMITTED_CODE_DIV_XPATH, 3);
    await codeDiv[0].click();

    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");

    await page.keyboard.down("Control");
    await page.keyboard.press("KeyC");
    await page.keyboard.up("Control");

    const copiedText = clipboardy.readSync();
    var fileContent = { problemName: nameDivValue, language: languageDivValue, code: copiedText };

    //Saving the scrap details
    const filePath = `problems/${nameDivValue}.json`;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fileContent));
      console.log(`Code ${nameDivValue} saved`);
    } else {
      console.log(`Code ${nameDivValue} already exists.`);
    }
  } catch (e) {
    console.error(e);
  }
};
export const scrap = async (page) => {
  await scrapAndSaveCodeFromSubmissionId(page, "1070301624");
  // var content = fs.readFileSync(filePath);
  // content = JSON.parse(content);
  // console.log(content.code);
};
