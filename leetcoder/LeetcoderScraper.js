import {gql} from "../utils/utils.js";
import Logger from "../utils/Logger.js";
import {getBrowserDetails} from "../managers/BrowserManager.js";
import FileManager from "../managers/FileManager.js";

class LeetcoderScraper {
  static async #scrapeAndSaveCodeFromSubmissionId(id, page) {
    try {
      const {submissionDetails: d} = await gql(
        page,
        'query($id:Int!){submissionDetails(submissionId:$id){code statusDisplay lang{name} question{titleSlug}}}',
        {id: Number(id)}
      );
      if (!d || d.statusDisplay !== 'Accepted') return;

      const code = d.code.replace(/\r\n/g, '\n').trimEnd();
      await FileManager.saveScrapedSolution({problemName: d.question.titleSlug, language: d.lang.name, code});
    } catch (err) {
      Logger.error('Something went wrong!', err);
    }
  }

  static async #scrapeCodeFromAllSubmissions() {
    const {page} = await getBrowserDetails();
    const limit = 20;
    for (let offset = 0, hasNext = true; hasNext; offset += limit) {
      const {submissionList} = await gql(
        page,
        'query($o:Int!,$l:Int!){submissionList(offset:$o,limit:$l){submissions{id statusDisplay} hasNext}}',
        {o: offset, l: limit}
      );
      if (!submissionList) throw new Error('LeetCode returned no submissions; the saved login is probably expired (run mode L).');
      const ids = submissionList.submissions.filter((s) => s.statusDisplay === 'Accepted').map((s) => s.id);
      Logger.success(`Accepted submission ids fetched from offset ${offset}`, ids);
      for (const id of ids) {
        await this.#scrapeAndSaveCodeFromSubmissionId(id, page);
      }
      hasNext = submissionList.hasNext;
    }
  }

  static async scrapeAcceptedSolutions() {
    Logger.error('<<<< Starting Leetcoder Scrapper >>>>');
    await this.#scrapeCodeFromAllSubmissions();
    Logger.error('<<<< Exiting Leetcoder Scrapper >>>>');
  }
}

export default LeetcoderScraper;
