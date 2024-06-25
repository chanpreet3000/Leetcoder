
# NOTE
1) Works on new dynamic layout only.
2) Only works on Windows. Do raise a PR if you can solve this problem for mac.
3) Use Responsibly
4) Last checked and working on 25-06-2024.
5) Currently, No Data is being sent to anything external to your system.

# Leetcoder

Leetcoder is a tool designed to automate your Leetcode experience, making problem-solving and scraping more efficient than ever. Whether you're a competitive programmer or a coding enthusiast, this bot can help
you bump up the resume stats.

Automatically login, solve and scrape Leetcode questions seamlessly. With its advanced automated capabilities, **Leetcoder can solve up to 200 problems in just 60 minutes.**

## Features

1. ### Automated Problem-Solving
   Leetcoder automates the process of solving Leetcode questions.

2. ### Seamless Login
   Leetcoder handles user authentication.

3. ### Solution Scraping
   Leetcoder can scrape and organize your accepted solutions, making it easy to track your progress and maintain a
   personal archive of your coding accomplishments.

4. ### Resume Solving from Where You Left Off
   Leetcoder remembers the last problem it solved, so it can resume solving questions right from where you left off.

## Usage Disclaimer

Leetcoder should be used responsibly and solely for educational purposes. This bot is not intended to be used for
unethical purposes, such as solving or faking solved problems on Leetcode for the purpose of gaining unfair advantages.
Always follow Leetcode\'s terms of service and community guidelines when using this tool.

## Getting Started

1. Clone the Leetcoder repository.
   ```
   git clone https://github.com/chanpreet3000/LeetCoder
   ```

2. Open Leetcoder in a code editor.
3. Inside the Editor's terminal run `yarn install`.
4. Go to `data.js` file
    - Set `USER_EMAIL` to your email.
    - Update `GOOGLE_CHROME_EXECUTABLE_PATH`. (steps in `data.js`)
5. To start the bot run `node index.js` in the terminal.
6. Directories for all the data stored
    - **Scraped Data** `./UserData/your_email/LeetcoderData/ScrapedSolutions`
    - **Solver Data** `./UserData/your_email/LeetcoderData/SolvedProblems.json`
      *consists of array of solved problem names, so that the bot can resume where you left*
    - **Chrome Data:** `./UserData/your_email/ProfileData` *contains all the chrome data to make sure you don't get
      logged out*

## Compatibility

Leetcoder is designed for use on Windows operating systems. It utilizes specific functionalities that are not compatible
with macOS. As such, it is not supported on macOS.

*Please ensure you are using a Windows environment when using Leetcoder for the best experience.*

## Contributing

If you'd like to contribute to the development of Leetcoder, we welcome your ideas, suggestions, and code contributions.
Feel free to open issues and pull requests on our GitHub repository.

## License

This project is licensed under the MIT License.
