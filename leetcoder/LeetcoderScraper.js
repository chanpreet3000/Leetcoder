import Logger from "../utils/Logger.js";
import {getBrowserDetails} from "../managers/BrowserManager.js";
import FileManager from "../managers/FileManager.js";
import { ALLOWED_LANGUAGES } from "../data.js";

class LeetcoderScraper {
  static async #executeGraphQL(page, query, variables) {
    return await page.evaluate(async (q, v) => {
      const res = await fetch('https://leetcode.com/graphql/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: q, variables: v })
      });
      return res.json();
    }, query, variables);
  }

  static async #scrapeAndSaveCodeFromSubmissionId(id, page) {
    try {
      const query = `
        query submissionDetails($submissionId: Int!) {
          submissionDetails(submissionId: $submissionId) {
            code
            lang {
              name
            }
            question {
              titleSlug
            }
          }
        }
      `;

      const response = await this.#executeGraphQL(page, query, { submissionId: parseInt(id) });
      
      if (!response.data || !response.data.submissionDetails) {
         Logger.error(`[SCRAPE_FAILED]\t: Could not fetch details for submission ${id}`);
         return;
      }

      const details = response.data.submissionDetails;
      const code = details.code;
      const language = details.lang.name;
      const problemName = details.question.titleSlug;

      if (!code) return false; // sometimes empty if error

      const langAliases = {
        'python': 'python3', 'python3': 'python3',
        'javascript': 'javascript', 'typescript': 'typescript',
        'java': 'java', 'cpp': 'cpp', 'c': 'c',
        'csharp': 'csharp', 'golang': 'golang', 'go': 'golang',
        'ruby': 'ruby', 'swift': 'swift', 'kotlin': 'kotlin',
        'rust': 'rust', 'scala': 'scala', 'php': 'php',
        'dart': 'dart', 'mysql': 'mysql', 'mssql': 'mssql'
      };

      if (ALLOWED_LANGUAGES.length > 0) {
        const normalizedAllowed = ALLOWED_LANGUAGES.map(l => langAliases[l.toLowerCase()] || l.toLowerCase());
        const normalizedLang = langAliases[language.toLowerCase()] || language.toLowerCase();
        
        if (!normalizedAllowed.includes(normalizedLang)) {
          Logger.warn(`[SKIPPED_LANG]\t\t: ${problemName} (${language} is not in ALLOWED_LANGUAGES)`);
          return false;
        }
      }
      
      let fileContent = { problemName, language, code };
      await FileManager.saveScrapedSolution(fileContent);
      Logger.success(`[SAVED]\t\t\t: ${problemName} (${language})`);
      return true;
    } catch (err) {
      Logger.error(`[ERROR]\t\t\t: Failed to scrape submission ${id}`, err);
      return false;
    }
  }

  static async #scrapeCodeFromAllSubmissions() {
    const {page} = await getBrowserDetails();

    // Ensure we are on LeetCode so that fetch has the correct origin and cookies.
    if (!page.url().includes('leetcode.com')) {
       await page.goto('https://leetcode.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    const query = `
      query submissionList($offset: Int!, $limit: Int!, $lastKey: String, $questionSlug: String) {
        submissionList(offset: $offset, limit: $limit, lastKey: $lastKey, questionSlug: $questionSlug) {
          lastKey
          hasNext
          submissions {
            id
            title
            titleSlug
            statusDisplay
            lang
          }
        }
      }
    `;

    let offset = 0;
    const limit = 20;
    let hasNext = true;
    let lastKey = null;

    while (hasNext) {
      Logger.warn(`[FETCHING_PAGE]\t\t: Fetching submissions offset ${offset}...`);
      
      const response = await this.#executeGraphQL(page, query, { offset, limit, lastKey });
      
      if (!response || !response.data || !response.data.submissionList) {
         Logger.error('Failed to fetch submission list. Invalid response or you might not be logged in.');
         break;
      }

      const data = response.data.submissionList;
      hasNext = data.hasNext;
      lastKey = data.lastKey;

      const submissions = data.submissions || [];
      const acceptedSubmissions = submissions.filter(sub => sub.statusDisplay === 'Accepted');

      Logger.success(`[FOUND]\t\t\t: ${acceptedSubmissions.length} Accepted submissions in this batch.`);

      for (const sub of acceptedSubmissions) {
        await this.#scrapeAndSaveCodeFromSubmissionId(sub.id, page);
        // Add a small delay between each submission fetch to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      }
      
      offset += limit;
      
      // Gentle sleep to avoid hammering the API
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  static async scrapeAcceptedSolutions() {
    Logger.error('<<<< Starting Leetcoder Scrapper >>>>');
    await this.#scrapeCodeFromAllSubmissions();
    Logger.error('<<<< Exiting Leetcoder Scrapper >>>>');
  }

  static async scrapeSingleProblem(problemSlug) {
    const {page} = await getBrowserDetails();
    if (!page.url().includes('leetcode.com')) {
      await page.goto('https://leetcode.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    const query = `
      query submissionList($offset: Int!, $limit: Int!, $lastKey: String, $questionSlug: String) {
        submissionList(offset: $offset, limit: $limit, lastKey: $lastKey, questionSlug: $questionSlug) {
          lastKey
          hasNext
          submissions {
            id
            statusDisplay
          }
        }
      }
    `;

    const response = await this.#executeGraphQL(page, query, { offset: 0, limit: 20, lastKey: null, questionSlug: problemSlug });
    
    if (!response || !response.data || !response.data.submissionList) {
      Logger.error(`[SCRAPE_FAILED]\t\t: Could not fetch submissions for ${problemSlug}`);
      return false;
    }

    const accepted = response.data.submissionList.submissions.find(s => s.statusDisplay === 'Accepted');
    if (!accepted) {
      return false;
    }

    return await this.#scrapeAndSaveCodeFromSubmissionId(accepted.id, page);
  }

  static async fetchEditorialSolution(problemSlug) {
    const {page} = await getBrowserDetails();
    if (!page.url().includes('leetcode.com')) {
      await page.goto('https://leetcode.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    // Determine preferred language
    const langMap = {
      'python': 'python3', 'python3': 'python3',
      'javascript': 'javascript', 'typescript': 'typescript',
      'java': 'java', 'cpp': 'cpp', 'c': 'c',
      'csharp': 'csharp', 'golang': 'golang', 'go': 'golang',
      'ruby': 'ruby', 'swift': 'swift', 'kotlin': 'kotlin',
      'rust': 'rust', 'scala': 'scala', 'php': 'php',
      'dart': 'dart', 'mysql': 'mysql', 'mssql': 'mssql',
    };

    const langDisplayMap = {
      'python3': 'Python3', 'python': 'Python', 'javascript': 'JavaScript', 'typescript': 'TypeScript',
      'java': 'Java', 'cpp': 'C++', 'c': 'C', 'csharp': 'C#',
      'golang': 'Go', 'ruby': 'Ruby', 'swift': 'Swift', 'kotlin': 'Kotlin',
      'rust': 'Rust', 'scala': 'Scala', 'php': 'PHP', 'dart': 'Dart',
      'mysql': 'MySQL', 'mssql': 'MS SQL Server',
    };

    let preferredLangs = ALLOWED_LANGUAGES.length > 0
      ? ALLOWED_LANGUAGES.map(l => langMap[l.toLowerCase()]).filter(Boolean)
      : ['python3'];

    // Step 1: Fetch the official editorial content via GraphQL
    Logger.warn(`[EDITORIAL_FETCH]\t\t: Fetching official editorial for ${problemSlug}...`);
    
    const editorialQuery = `
      query officialSolution($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          solution {
            id
            content
            canSeeDetail
            paidOnly
          }
        }
      }
    `;

    const editorialResponse = await this.#executeGraphQL(page, editorialQuery, { titleSlug: problemSlug });

    if (!editorialResponse?.data?.question?.solution?.content) {
      Logger.error(`[EDITORIAL_FETCH]\t\t: No editorial available for ${problemSlug}`);
      return false;
    }

    const solution = editorialResponse.data.question.solution;
    if (solution.paidOnly && !solution.canSeeDetail) {
      Logger.error(`[EDITORIAL_FETCH]\t\t: Editorial is premium-only for ${problemSlug}`);
      return false;
    }

    const content = solution.content;

    // Step 2: Extract playground UUID from editorial content
    const playgroundMatch = content.match(/leetcode\.com\/playground\/([a-zA-Z0-9]+)\//);

    if (playgroundMatch) {
      const playgroundId = playgroundMatch[1];
      Logger.warn(`[EDITORIAL_FETCH]\t\t: Found playground ${playgroundId}, navigating to extract code...`);

      // Use the puppeteer browser to navigate to the playground (bypasses Cloudflare)
      const playgroundUrl = `https://leetcode.com/playground/${playgroundId}/shared`;
      await page.goto(playgroundUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000)); // Wait for Monaco editor to load

      // Extract code from the playground using language buttons and textarea
      const playgroundCode = await page.evaluate(async (preferredLangs, langDisplayMap) => {
        await new Promise(r => setTimeout(r, 2000)); // wait for playground UI

        const buttons = Array.from(document.querySelectorAll('.lang-btn-set .btn'));
        let detectedLang = null;
        let clicked = false;
        
        for (const pref of preferredLangs) {
          const label = displayMap[pref] || pref;
          const btn = buttons.find(b => b.textContent.trim().toLowerCase() === label.toLowerCase() || b.textContent.trim().toLowerCase() === pref.toLowerCase());
          if (btn) {
            btn.click();
            detectedLang = pref;
            clicked = true;
            break;
          }
        }

        if (!clicked) {
          const activeBtn = document.querySelector('.lang-btn-set .btn.active');
          if (activeBtn) detectedLang = activeBtn.textContent.trim().toLowerCase();
        }

        if (clicked) {
          await new Promise(r => setTimeout(r, 1000)); // wait for textarea to update
        }
        
        const ta = document.querySelector('textarea[name="lc-codemirror"]');
        return ta ? { code: ta.value, lang: detectedLang } : null;
      }, preferredLangs, langDisplayMap);

      if (playgroundCode && playgroundCode.code && playgroundCode.code.trim().length > 10) {
        let detectedLang = playgroundCode.lang || preferredLangs[0];
        
        // Reverse mapping to get the proper display name if it's missing
        let displayLang = langDisplayMap[detectedLang];
        if (!displayLang) {
            const entry = Object.entries(langDisplayMap).find(([k, v]) => v.toLowerCase() === detectedLang.toLowerCase());
            if (entry) {
              detectedLang = entry[0];
              displayLang = entry[1];
            } else {
              displayLang = detectedLang;
            }
        }

        const code = playgroundCode.code.trim();
        const fileContent = { problemName: problemSlug, language: displayLang, code: code };
        await FileManager.saveProblem(fileContent);
        Logger.success(`[EDITORIAL_FOUND]\t\t: Saved editorial solution for ${problemSlug} (${displayLang})`);
        return true;
      }
    }

    // Step 3: Fallback — extract code blocks directly from the editorial markdown
    Logger.warn(`[EDITORIAL_FETCH]\t\t: Trying to extract code from editorial markdown...`);
    const codeBlockRegex = /```(?:\w*)\n([\s\S]*?)```/g;
    let bestCode = null;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const code = match[1].trim();
      if (!bestCode || code.length > bestCode.length) {
        bestCode = code;
      }
    }

    if (bestCode && bestCode.length > 10) {
      let detectedLang = preferredLangs[0];
      if (bestCode.includes('def ') && bestCode.includes(':')) detectedLang = 'python3';
      else if (bestCode.includes('function ')) detectedLang = 'javascript';
      else if (bestCode.includes('class Solution') && bestCode.includes('public')) detectedLang = 'java';

      const displayLang = langDisplayMap[detectedLang] || detectedLang;
      const fileContent = { problemName: problemSlug, language: displayLang, code: bestCode };
      await FileManager.saveProblem(fileContent);
      Logger.success(`[EDITORIAL_FOUND]\t\t: Saved editorial solution for ${problemSlug} (${displayLang})`);
      return true;
    }

    Logger.error(`[EDITORIAL_FAILED]\t\t: Could not extract code from editorial for ${problemSlug}`);
    return false;
  }

  /**
   * This is only for testing and scraping global solutions not relevant to the users.
   */
  static async scrapeAcceptedSolutionsGlobally() {
    Logger.error('<<<< Starting Leetcoder Scrapper Globally >>>>');
    const {page} = await getBrowserDetails();
    if (!page.url().includes('leetcode.com')) {
       await page.goto('https://leetcode.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    try {
      let id_no = 1010011580;
      let limit = 0;
      while (limit < 10) {
        for (let idx = 0; idx < 10; idx++) {
          await this.#scrapeAndSaveCodeFromSubmissionId(id_no, page);
          id_no++;
          await new Promise(r => setTimeout(r, 500));
        }
        await new Promise(r => setTimeout(r, 3000));
        Logger.warn('LAST FETCHED IS ', id_no);
        limit++;
      }
    } catch (e) {
      Logger.error(e);
    }
    Logger.error('<<<< Exiting Leetcoder Scrapper >>>>');
  }
}

export default LeetcoderScraper;
