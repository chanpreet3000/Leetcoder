import Logger from "./Logger.js";
import readline from 'readline';
import LeetcoderBot from "./LeetcoderBot.js";
import LeetcoderAuthenticator from "./LeetcoderAuthenticator.js";
import {LEETCODER_ASCII_ART} from "./constants.js";

const leetcoderModeString = `
     Select a mode
     [1] Login leetcode (login if this is your first time or if you logged out).
     [2] Start Leetcode Bot.
     [3] Scrape Solved Leetcode Problems.
     [any other] Exit.
    `;

const exitingLeetcode = `Thanks for using Leetcoder. Please report any bugs/issues Github Link : https://github.com/chanpreet3000/leetcode-bot`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

(async () => {
  try {
    Logger.success(LEETCODER_ASCII_ART);
    Logger.error(leetcoderModeString);
    const type = await question('Select mode (1, 2, 3 or other): ');

    if (type === '1') {
      await LeetcoderAuthenticator.loginUser();
    } else if (type === '2') {
      await LeetcoderBot.solve();
    } else if (type === '3') {
      await LeetcoderBot.scrape();
    }
  } catch (err) {
    Logger.error('Something went wrong!', err);
  } finally {
    Logger.error(exitingLeetcode);
    rl.close();
    process.exit();
  }
})();