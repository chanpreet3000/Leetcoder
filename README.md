# LeetCoder

LeetCoder is a powerful tool designed to automate your LeetCode experience, making problem-solving and tracking your progress more efficient than ever. Whether you're a competitive programmer or a coding enthusiast, this bot can help you:

Automatically Solve LeetCode Questions
Handle Login and Logout Seamlessly
Scrape and Organize Your Accepted Solutions
With its advanced capabilities, **LeetCoder can solve up to 200 problems in just 60 minutes**
# Features
1. **Automated Problem Solving**
LeetCoder automates the process of solving LeetCode questions. Simply provide the user details, and LeetCoder will submit solutions for you.

2. **Seamless Login and Logout**
No more manual login and logout hassles. LeetCoder handles user authentication.

3. **Solution Scraping**
LeetCoder can scrape and organize your accepted solutions, making it easy to track your progress and maintain a personal archive of your coding accomplishments.

4. **Resume Solving from Where You Left Off**
LeetCoder remembers the last problem it solved, so you can resume solving questions right from where you left off.

5. **Parallel Execution of Multiple Accounts**
LeetCoder supports parallel execution, allowing multiple users to run the bot simultaneously. Each user can have their own LeetCode account configuration, and LeetCoder will manage the concurrent execution seamlessly.

# Usage Disclaimer
LeetCoder should be used responsibly and solely for educational purposes. This bot is not intended to be used for unethical purposes, such as solving or faking solved problems on LeetCode for the purpose of gaining unfair advantages. Always follow LeetCode's terms of service and community guidelines when using this tool.

# Getting Started
1. Clone the github repository using ```git clone https://github.com/chanpreet3000/LeetCoder```
2. Open the repository in a code editor
3. Inside the Editor's terminal run `npm i`
4. Inside `.env` file, change the value of `GOOGLE_CHROME_EXECUTABLE_PATH` (depends of Operating System)
5. Create a `data.js` file and enter the following code
```
export const users = [
    {
        email: "enter you leetcode email here",
        password: "enter you leetcode password here",
        scrape_accepted_solutions: false,
        solve_solutions: false,
    },
    // you can add multiple users.
    // the bot will run in parallel for all users
];

```
- To get all your accepted submissions you can set `scrape_accepted_solutions = true`
- To solve all available solutions set `solve_solutions: true`
6. To start the bot run `node index.js` in the terminal.
7. Directories for all the data stored
    -   **Scraped Data:** `./UserData/your_email/LeetCodeData/AcceptedSolutions`
    -   **Solver Data:** `./UserData/your_email/LeetCodeData/SolvedProblems.json`
        *consists of array of solved problem names, so that the bot can resume where you left*
    -   **Chrome Data:** `./UserData/your_email/ProfileData` *contains all the chrome data to make sure you don't get logged out*

# Contributing
If you'd like to contribute to the development of LeetCoder, we welcome your ideas, suggestions, and code contributions. Feel free to open issues and pull requests on our GitHub repository.

# License
This project is licensed under the MIT License.