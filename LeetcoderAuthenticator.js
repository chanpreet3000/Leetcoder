import {getElementBySelector} from "./utils/utils.js";
import Logger from "./utils/Logger.js";
import {LEETCODER_ASCII_ART} from "./constants.js";
import {getBrowserDetails} from "./managers/BrowserManager.js";

class LeetcoderAuthenticator {
  static #loginUserHandler = async () => {
    const {page} = await getBrowserDetails();
    await page.goto(`https://leetcode.com/accounts/login/`, {
      waitUntil: "networkidle2",
    });

    try {
      await getElementBySelector(page, '#navbar_user_avatar', 3, 0);
      Logger.success('User was already logged in.')
      return;
    } catch (_) {
    }
    Logger.success('Login Leetcode using your credentials!')

    // Convert ASCII art to HTML-friendly format
    const formattedAsciiArt = LEETCODER_ASCII_ART.replace(/ /g, '&nbsp;').replace(/\n/g, '<br>');

    await page.evaluate((asciiArt) => {
      const appElement = document.getElementById('app');
      if (appElement) {
        const parDiv = document.createElement('div');
        const newDiv = document.createElement('div');
        newDiv.innerHTML = `${asciiArt}<br>
        Please log in using your credentials (You have only 10 min to login).<br>
        After Successful Login, Close the browser and start the program again.<br>
        Cloudfare will always fail, try below steps<br>
        [1] type email and password, and then sign in without interacting with cloudfare.<br>
        [2] type email and password, and then click on cloudfare and instantly click sign in.<br>
        `;

        parDiv.style.display = 'flex';
        parDiv.style.flexDirection = 'row';
        parDiv.style.justifyContent = 'center';
        parDiv.style.alignItems = 'center';
        parDiv.style.color = '#fcfcfc'
        parDiv.style.padding = '2rem';
        parDiv.style.backgroundColor = '#181818';


        parDiv.appendChild(newDiv);
        appElement.insertBefore(parDiv, appElement.firstChild);
      }
    }, formattedAsciiArt);

    await getElementBySelector(page, '#navbar_user_avatar', 600, 0);
    Logger.success('User Logged in successfully');
  };

  static loginUser = async () => {
    Logger.error('<<<< Starting Leetcoder Authenticator >>>>');
    await this.#loginUserHandler();
    Logger.error('<<<< Exiting Leetcoder Authenticator >>>>');
  };
}

export default LeetcoderAuthenticator;
