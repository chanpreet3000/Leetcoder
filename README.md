# How to use
1) Clone the github repository using ```git clone https://github.com/chanpreet3000/leetcode-bot```
2) Open the repository in a code editor
3) Inside the Editor's terminal run `npm i`
4) Create a `.env` file and paste the following code
```
    # change this according to your device
    GOOGLE_CHROME_DIRECTORY = "C:/Program Files/Google/Chrome/Application/chrome.exe" 
```
5) Create a `data.js` file and enter the following code
```
    export const users = [
        {
            email: "enter your email here",
            password: "enter your password here",
        },
    ];

````
6) To start the bot run `node index.js` in the terminal.