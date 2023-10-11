# How to use
1) Clone the github repository using ```git clone https://github.com/chanpreet3000/leetcode-bot```
2) Open the repository in a code editor
3) Inside the Editor's terminal run `npm i`
4) Create a `data.js` file and enter the following code
    ```
    const users = [
        {
            email: "enter your leetcode email here",
            password: "enter your leetcode password here",
        },
    ];
    module.exports = { users };
    ````
5) To start the bot run `node index.js` in the terminal.