import {spawn} from 'child_process';
import path from 'path';
import Logger from '../utils/Logger.js';
import {CHROME_PROFILE_PATH, GOOGLE_CHROME_EXECUTABLE_PATH} from '../data.js';

class LeetcoderLogin {
  static loginUser = () => {
    return new Promise((resolve, reject) => {
      const profileDir = path.resolve(CHROME_PROFILE_PATH);
      const startedAt = Date.now();

      Logger.success('Opening a normal Chrome window for you to log in...');
      Logger.success('  1. Log in to LeetCode.');
      Logger.success('  2. Once logged in, close the Chrome window to continue.');

      const chrome = spawn(
        GOOGLE_CHROME_EXECUTABLE_PATH,
        [
          `--user-data-dir=${profileDir}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized',
          // puppeteer launches Chrome with a mock keychain on macOS; cookies must be encrypted the same way or the bot sees a logged-out profile
          '--use-mock-keychain',
          'https://leetcode.com/accounts/login/',
        ],
        {stdio: 'ignore'}
      );

      chrome.on('error', (err) => {
        Logger.error(`Failed to launch Chrome at "${GOOGLE_CHROME_EXECUTABLE_PATH}". Check GOOGLE_CHROME_EXECUTABLE_PATH in your .env.`, err);
        reject(err);
      });

      chrome.on('exit', () => {
        if (Date.now() - startedAt < 5000) {
          Logger.error('Chrome exited immediately; another Chrome is probably using this profile (is Leetcoder already running?). Close it and retry.');
          return resolve();
        }
        Logger.success('Chrome closed. Modes 1-3 check the login before they start.');
        resolve();
      });
    });
  };
}

export default LeetcoderLogin;
