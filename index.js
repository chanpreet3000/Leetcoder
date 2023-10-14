import { start } from "./bot.js";
import { users } from "./data.js";
import chalk from "chalk";

(async () => {
  users.forEach(async (user) => {
    try {
      await start(user);
    } catch (err) {
      console.error(chalk.red("Something went wrong with error : " + err));
    }
  });
})();
