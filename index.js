const { start } = require("./bot");
const { users } = require("./data");
(async () => {
  users.forEach(async (user) => {
    try {
      await start(user);
    } catch (err) {
      console.error(err);
    }
  });
})();
