import { start } from "./bot.js";
import { users } from "./data.js";
(async () => {
  users.forEach(async (user) => {
    try {
      await start(user);
    } catch (err) {
      console.error("Something went wrong with error : " + err);
    }
  });
})();
