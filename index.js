import Logger from "./utils/Logger.js";
import readline from 'readline';
import LeetcoderAuthenticator from "./leetcoder/LeetcoderAuthenticator.js";
import LeetcoderLogin from "./leetcoder/LeetcoderLogin.js";
import {EXITING_LEETCODER, LEETCODER_ASCII_ART, LEETCODER_MODE_QUESTION} from "./utils/constants.js";
import LeetcoderSolver from "./leetcoder/LeetcoderSolver.js";
import {closeBrowser} from "./managers/BrowserManager.js";
import LeetcoderScraper from "./leetcoder/LeetcoderScraper.js";

// puppeteer rejects from its own event handlers; log them instead of crashing the whole run
process.on("unhandledRejection", (err) => Logger.error("Unhandled rejection", err));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// closed input (piped stdin that already ended) reads as a blank answer instead of crashing
const question = (query) => {
  return new Promise((resolve) => {
    try {
      rl.question(query, resolve);
    } catch (_) {
      resolve('');
    }
  });
};

(async () => {
  try {
    Logger.success(LEETCODER_ASCII_ART);
    Logger.success(LEETCODER_MODE_QUESTION);
    const type = await question('Select mode (L, 1, 2, 3, C, F or other): ');

    if (type.toLowerCase() === 'l') {
      await LeetcoderLogin.loginUser();
    } else if (type === '1') {
      await LeetcoderAuthenticator.loginUser();
      await LeetcoderSolver.solve();
    } else if (type === '2') {
      await LeetcoderAuthenticator.loginUser();
      await LeetcoderScraper.scrapeAcceptedSolutions();
    } else if (type === '3') {
      await LeetcoderAuthenticator.loginUser();
      await LeetcoderSolver.solveDailyChallenge();
    } else if (type.toLowerCase() === 'f') {
      await LeetcoderSolver.reviewFailures(question);
    } else if (type.toLowerCase() === 'c') {
      await LeetcoderAuthenticator.loginUser();
      await LeetcoderSolver.preflight();
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