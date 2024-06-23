import {getPage, sleep} from "./utils.js";
import Logger from "./Logger.js";
import {LEETCODER_ASCII_ART} from "./constants.js";

class LeetcoderAuthenticator {
  static #loginUserHandler = async () => {
    const {page} = await getPage();
    await page.goto(`https://leetcode.com/accounts/login/`, {
      waitUntil: "networkidle2",
    });

    // Convert ASCII art to HTML-friendly format
    const formattedAsciiArt = LEETCODER_ASCII_ART.replace(/ /g, '&nbsp;').replace(/\n/g, '<br>');

    await page.evaluate((asciiArt) => {
      const appElement = document.getElementById('app');
      if (appElement) {
        const newDiv = document.createElement('div');
        newDiv.innerHTML = `${asciiArt}<br>
        Please log in using your credentials (You have only 10 min to login).<br>
        After Successful Login, Close the browser and start the program again.<br>
        Cloudfare will always fail, try below steps<br>
        [1] type email and password, and then sign in without interacting with cloudfare.<br>
        [2] type email and password, and then click on cloudfare and instantly click sign in.<br>
        `;
        newDiv.style.backgroundColor = '#181818';
        newDiv.style.padding = '2rem';
        newDiv.style.color = '#fcfcfc'
        appElement.insertBefore(newDiv, appElement.firstChild);
      }
    }, formattedAsciiArt);

    await sleep(600);
  };

  static loginUser = async () => {
    Logger.error('<<<< Starting Leetcoder Authenticator >>>>');
    await this.#loginUserHandler();
    Logger.error('<<<< Exiting Leetcoder Authenticator >>>>');
  };
}

export default LeetcoderAuthenticator;
