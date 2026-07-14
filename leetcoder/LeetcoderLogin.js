import {spawn} from 'child_process';
import path from 'path';
import Logger from '../utils/Logger.js';
import {CHROME_PROFILE_PATH, GOOGLE_CHROME_EXECUTABLE_PATH} from '../data.js';

class LeetcoderLogin {
  static loginUser = () => {
    return new Promise((resolve, reject) => {
      const profileDir = path.resolve(CHROME_PROFILE_PATH);

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
          'https://leetcode.com/accounts/login/',
        ],
        {stdio: 'ignore'}
      );

      chrome.on('error', (err) => {
        Logger.error(`Failed to launch Chrome at "${GOOGLE_CHROME_EXECUTABLE_PATH}". Check GOOGLE_CHROME_EXECUTABLE_PATH in your .env.`, err);
        reject(err);
      });

      chrome.on('exit', () => {
        Logger.success('Chrome closed. Login saved to your profile.');
        resolve();
      });
    });
  };
}

export default LeetcoderLogin;
