
<p align="center">
  <img src="https://img.shields.io/github/stars/chanpreet3000/Leetcoder?style=for-the-badge&logo=github&color=gold" alt="GitHub stars" />
  <img src="https://img.shields.io/github/forks/chanpreet3000/Leetcoder?style=for-the-badge&logo=github" alt="GitHub forks" />
  <img src="https://img.shields.io/github/issues/chanpreet3000/Leetcoder?style=for-the-badge&logo=github" alt="GitHub issues" />
</p>

<h1 align="center">Leetcoder</h1>

<h2 align="center">Last verified working on 15 July 2026</h2>

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
2. Supports **Windows** and **macOS**.
3. **Use responsibly** and in line with LeetCode’s terms.
4. **Privacy:** no data is sent anywhere outside your machine by this tool (see your own Chrome/network setup as usual).

> **Verified working:** **15 July 2026** — if you’re reading this months later, check the “Last commit” badge above; regular commits usually mean the layout selectors are still being kept in sync.

Leetcoder is built to make problem-solving and scraping more efficient. With its automated flow, **Leetcoder can solve on the order of ~200 problems in about an hour** (network and UI permitting).

## Features

1. ### Automated problem solving  
   Automates solving LeetCode questions from your saved Java solutions. Problem JSON files using another language are skipped.

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
   On macOS the default is `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, so you can usually omit this line. This must point to the Chrome executable, or to the Chrome `Application` directory (Windows) / `Google Chrome.app` bundle (macOS); when a directory is provided, Leetcoder automatically uses the executable inside it.
5. Run: `yarn run start`, then pick a mode:
   ```text
   [L] Login to LeetCode   ← run this first
   [1] Start Leetcode Bot.
   [2] Scrape Solved Leetcode Problems.
   ```

### First run: log in

Pick **`L`** on the first run. A Chrome window opens on the LeetCode login page — log in, then **close the window**. Your session is saved to the local Chrome profile, so run `yarn run start` again and pick `1` or `2` to start.

> Log in again with `L` whenever your session expires. The login window and the bot can't run at the same time, so it's a separate step.

If Google displays **“This browser or app may not be secure”**, do not try to sign in from mode `1`. Mode `1` uses Puppeteer for automation, which Google may reject during OAuth. Exit the program, select **`L`**, complete the sign-in in the regular Chrome window it opens, close that window after LeetCode is logged in, and then select **`1`** again. Google account security checks cannot be safely bypassed by the bot.

If login takes longer than usual, the browser can continue loading while Leetcoder waits for the login page to become ready. Keep the browser open and complete sign-in; Leetcoder then waits for the logged-in account avatar.

### Checking a run

- Modes `1`–`3` first confirm you are logged in and exit straight away with a hint if not (run `L`). They also check the LeetCode page layout on `two-sum` before submitting anything. Mode `C` runs only that check.
- Every failed or skipped problem goes into `FailedProblems.json` with its verdict and details. Entries are marked `"kind": "solution"` (the stored code needs fixing, e.g. Wrong Answer) or `"kind": "infra"` (rate limit, timeout or page problem; a rerun may pass). Infra failures also save a screenshot and the page HTML in `failures/`. An entry is removed once that problem is accepted.
- A `solution` failure is not resubmitted while its code is unchanged; edit `problems/<name>.json` and it is retried on the next run. Mode `F` lists every failed or skipped problem with its reason, and lets you skip problems for good (or un-skip them with `-name`).
- Submissions are spaced at least 12 seconds apart to avoid rate limits. The bot also waits out LeetCode rate limits (HTTP 429), relaunches Chrome if it crashes, and stops after 5 infra failures in a row.
- On macOS, start long runs with `caffeinate -dis npm start` so the Mac does not sleep mid-run (sleep stalls Chrome and shows up as timeouts, especially on battery).
- `npm test` runs offline self-checks.

### Where data lives

| Kind | Path |
|------|------|
| Scraped solutions | `./UserData/your_email/LeetcoderData/ScrapedSolutions` |
| Solved problem list (resume) | `./UserData/your_email/LeetcoderData/SolvedProblems.json` |
| Failed / skipped problems | `./UserData/your_email/LeetcoderData/FailedProblems.json` and `failures/` |
| Chrome profile (stay logged in) | `./UserData/your_email/ProfileData` |

## Compatibility

Leetcoder runs on **Windows** and **macOS**. On macOS, Chrome is found at `/Applications/Google Chrome.app` by default; set `GOOGLE_CHROME_EXECUTABLE_PATH` in `.env` (the `.app` bundle path also works) if yours lives elsewhere.

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/chanpreet3000/Leetcoder). See **This project is maintained** above if you’re unsure how to report something.

## License

Open source under the [MIT License](LICENSE). Free to use and modify for fun or learning; no warranty. If you build on it, a star or mention is appreciated but not required.
