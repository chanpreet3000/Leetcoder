import dotenv from 'dotenv';
import path from 'path';
import {existsSync, statSync} from 'fs';

dotenv.config();

/**
 *  Try not to change anything below, if you don't know what are you messing with!
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
// [default executable, executable inside a Chrome directory/bundle]
const [defaultChromePath, chromeBinary] = {
  win32: ["C:/Program Files/Google/Chrome/Application/chrome.exe", 'chrome.exe'],
  darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", 'Contents/MacOS/Google Chrome'],
}[process.platform] ?? ["google-chrome"];
const configuredChromePath = process.env.GOOGLE_CHROME_EXECUTABLE_PATH || defaultChromePath;
export const GOOGLE_CHROME_EXECUTABLE_PATH =
  chromeBinary && existsSync(configuredChromePath) && statSync(configuredChromePath).isDirectory()
    ? path.join(configuredChromePath, chromeBinary)
    : configuredChromePath;

export const USER_EMAIL = process.env.USER_EMAIL || 'temp@temp.com';

/**
 * Chrome Profile directory
 */
export const CHROME_PROFILE_PATH = `./UserData/${USER_EMAIL}/ProfileData`;
/**
 * User Leetcode Data Directory
 */
export const LEETCODER_DATA_PATH = `./UserData/${USER_EMAIL}/LeetcoderData`;
/**
 * User Leetcode Data Directory
 */
export const LEETCODER_SCRAPED_SOLUTIONS_PATH = `${LEETCODER_DATA_PATH}/ScrapedSolutions`;
/**
 * Solved Problems are stored in this location so that the bot can continue solving from the unsolved problems.
 */
export const SOLVED_PROBLEMS_PATH = `${LEETCODER_DATA_PATH}/SolvedProblems.json`;
/**
 * Problems that failed or were skipped (with the reason) so they can be fixed; cleared per problem once it is accepted.
 */
export const FAILED_PROBLEMS_PATH = `${LEETCODER_DATA_PATH}/FailedProblems.json`;
