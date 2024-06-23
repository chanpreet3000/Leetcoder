import QuestionSolver from "./question_solver.js";
import Logger from "./Logger.js";
import {getPage} from "./utils.js";
import LeetcoderScraper from "./leetcoderScraper.js";

class LeetcoderBot {
  static async solve() {
    Logger.error('<<<< Starting Leetcoder Solver >>>>');
    await this.#startSolve();
    Logger.error('<<<< Exiting Leetcoder Solver >>>>');
  }

  static async scrape() {
    Logger.error('<<<< Starting Leetcoder Scrapper >>>>');
    await this.#startScrapper();
    Logger.error('<<<< Exiting Leetcoder Scrapper >>>>');
  }

  static async #startSolve() {
    const {page} = await getPage();
    try {
      const questionSolver = new QuestionSolver(page);
      await questionSolver.solve();
    } catch (err) {
      Logger.error('Something went wrong!', err);
    }
  }

  static async #startScrapper() {
    try {
      const {page} = await getPage();
      const questionScraper = new LeetcoderScraper(page);
      await questionScraper.scrapeAllAcceptedSubmissions();
    } catch (err) {
      Logger.error('Something went wrong!', err);
    }
  }
}

export default LeetcoderBot;
