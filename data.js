import dotenv from 'dotenv';

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
export const GOOGLE_CHROME_EXECUTABLE_PATH = process.env.GOOGLE_CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

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
