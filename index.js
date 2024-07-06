import Logger from "./utils/Logger.js";
import readline from 'readline';
import LeetcoderAuthenticator from "./leetcoder/LeetcoderAuthenticator.js";
import {EXITING_LEETCODER, LEETCODER_ASCII_ART, LEETCODER_MODE_QUESTION} from "./utils/constants.js";
import LeetcoderSolver from "./leetcoder/LeetcoderSolver.js";
import {closeBrowser} from "./managers/BrowserManager.js";
import LeetcoderScraper from "./leetcoder/LeetcoderScraper.js";

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
    Logger.success(LEETCODER_MODE_QUESTION);
    const type = await question('Select mode (1, 2 or other): ');

    if (type === '1') {
      await LeetcoderAuthenticator.loginUser();
      await LeetcoderSolver.solve();
    } else if (type === '2') {
      await LeetcoderAuthenticator.loginUser();
      await LeetcoderScraper.scrapeAcceptedSolutions();
    } else if (type === '3') {
      await LeetcoderAuthenticator.loginUser();
      await LeetcoderScraper.scrapeAcceptedSolutionsGlobally();
    }
  } catch (err) {
    Logger.error('Something went wrong!', err);
  } finally {
    Logger.error(EXITING_LEETCODER);
    rl.close();
    await closeBrowser();
    process.exit();
  }
})();