
<p align="center">
  <img src="https://img.shields.io/github/stars/chanpreet3000/Leetcoder?style=for-the-badge&logo=github&color=gold" alt="GitHub stars" />
  <img src="https://img.shields.io/github/forks/chanpreet3000/Leetcoder?style=for-the-badge&logo=github" alt="GitHub forks" />
  <img src="https://img.shields.io/github/issues/chanpreet3000/Leetcoder?style=for-the-badge&logo=github" alt="GitHub issues" />
</p>

<h1 align="center">Leetcoder</h1>

<h2 align="center">Last verified working on 1 May 2026</h2>

<p align="center">
  <img src="https://img.shields.io/badge/maintenance-active-success?style=for-the-badge" alt="Actively maintained" />
  <img src="https://img.shields.io/github/last-commit/chanpreet3000/Leetcoder?style=for-the-badge&logo=git" alt="Last commit" />
</p>

<p align="center">
  Automate login, solving, and scraping on LeetCode so you can focus on learning — not busywork.
</p>

---

## This project is maintained

Leetcoder is **actively maintained**. If something breaks after a LeetCode UI change, or you hit a rough edge on Windows, **speak up** — that helps everyone.

- **Bug or regression?** Open a [GitHub issue](https://github.com/chanpreet3000/Leetcoder/issues) with steps to reproduce and your environment (Windows version, Chrome path, what you expected vs. what happened).
- **Feature idea or question?** Open an [issue](https://github.com/chanpreet3000/Leetcoder/issues) — questions are welcome too.
- **Want to reach out directly?** Message me on GitHub ([@chanpreet3000](https://github.com/chanpreet3000)) or use the contact options on my profile.

Stars and PRs are welcome. Even a short issue with a screenshot often saves hours for the next person.

---

## Important notes

1. Works on **LeetCode’s newer dynamic layout** only.
2. **Windows only** for now. PRs that add solid macOS support are very welcome.
3. **Use responsibly** and in line with LeetCode’s terms.
4. **Privacy:** no data is sent anywhere outside your machine by this tool (see your own Chrome/network setup as usual).

> **Verified working:** **1 May 2026** — if you’re reading this months later, check the “Last commit” badge above; regular commits usually mean the layout selectors are still being kept in sync.

Leetcoder is built to make problem-solving and scraping more efficient. With its automated flow, **Leetcoder can solve on the order of ~200 problems in about an hour** (network and UI permitting).

## Features

1. ### Automated problem solving  
   Automates solving LeetCode questions from your saved solutions.

2. ### Seamless login  
   Handles authentication via a persistent Chrome profile.

3. ### Solution scraping  
   Scrapes and organizes accepted solutions into a local archive.

4. ### Resume where you left off  
   Remembers solved problem names so runs can continue after interruption.

## Usage disclaimer

Leetcoder is for **educational use**. Do not use it to misrepresent your progress or break LeetCode’s rules. Always follow [LeetCode’s terms of service](https://leetcode.com/terms/) and community guidelines.

## Getting started

1. Clone the repo.
   ```bash
   git clone https://github.com/chanpreet3000/Leetcoder
   ```
2. Open the project in your editor.
3. In the terminal: `yarn install`
4. Create a `.env` in the project root:
   ```text
   ; Used only for the local Chrome profile folder name.
   USER_EMAIL=your_email_here
   ; Chrome → chrome://version/ → Executable Path
   GOOGLE_CHROME_EXECUTABLE_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe
   ```
5. Run: `node index.js`

### Where data lives

| Kind | Path |
|------|------|
| Scraped solutions | `./UserData/your_email/LeetcoderData/ScrapedSolutions` |
| Solved problem list (resume) | `./UserData/your_email/LeetcoderData/SolvedProblems.json` |
| Chrome profile (stay logged in) | `./UserData/your_email/ProfileData` |

## Compatibility

Leetcoder targets **Windows**. Behavior on macOS is not supported today — contributions to fix that are welcome.

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/chanpreet3000/Leetcoder). See **This project is maintained** above if you’re unsure how to report something.

## License

Open source under the [MIT License](LICENSE). Free to use and modify for fun or learning; no warranty. If you build on it, a star or mention is appreciated but not required.
