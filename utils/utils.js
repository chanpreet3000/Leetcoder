export const sleep = async (time) => {
  await new Promise((resolve) => setTimeout(resolve, time * 1000));
};

const isMac = process.platform === "darwin";
const cntrlKey = isMac ? "Meta" : "Control";

// On macOS Chrome ignores Cmd+key from synthetic events unless the native editing command is attached.
const shortcut = async (page, code, command) => {
  if (!isMac) {
    await page.keyboard.down(cntrlKey);
    await page.keyboard.press(code);
    await page.keyboard.up(cntrlKey);
    return;
  }
  const cdp = await page.createCDPSession();
  const key = code.slice(-1).toLowerCase();
  const ev = {modifiers: 4, key, code, windowsVirtualKeyCode: key.toUpperCase().charCodeAt(0)};
  await cdp.send("Input.dispatchKeyEvent", {type: "rawKeyDown", ...ev, commands: [command]});
  await cdp.send("Input.dispatchKeyEvent", {type: "keyUp", ...ev});
  await cdp.detach();
};

export const selectAllHelper = (page) => shortcut(page, "KeyA", "selectAll");
export const copyHelper = (page) => shortcut(page, "KeyC", "copy");
export const pasteHelper = (page) => shortcut(page, "KeyV", "paste");

// Runs a GraphQL query inside a leetcode.com page so it carries the logged-in session; far more stable than DOM paths.
// Backs off and retries when LeetCode rate-limits (HTTP 429).
export const gql = async (page, query, variables = {}) => {
  if (!page.url().startsWith("https://leetcode.com")) {
    await page.goto("https://leetcode.com/", {waitUntil: "domcontentloaded", timeout: 60000});
  }
  for (let attempt = 0; ; attempt++) {
    const {status, json} = await page.evaluate(async (query, variables) => {
      const res = await fetch("/graphql", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({query, variables}),
      });
      return {status: res.status, json: res.ok ? await res.json() : null};
    }, query, variables);
    if (status === 429 && attempt < 3) {
      await sleep(30 * 2 ** attempt);
      continue;
    }
    if (!json) throw new Error(`GraphQL request failed with HTTP ${status}`);
    if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
    return json.data;
  }
};
