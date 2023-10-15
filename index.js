import LeetCodeBot from "./bot.js";
import { users } from "./data.js";
import chalk from "chalk";

(async () => {
  users.forEach(async (user) => {
    try {
      const leetCodeBot = new LeetCodeBot(user);
      leetCodeBot.start();
    } catch (err) {
      console.error(chalk.red("Something went wrong with error : " + err));
    }
  });
})();
