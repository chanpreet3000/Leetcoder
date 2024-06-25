export const sleep = async (time) => {
  await new Promise((resolve) => setTimeout(resolve, time * 1000));
};

export const getElementByXPath = async (element, xpath, timeoutDelay = 30, delay = 1.3) => {
  await sleep(delay);
  await element.waitForXPath(xpath, {
    visible: true,
    timeout: timeoutDelay * 1000,
  });
  return await element.$x(xpath);
};

export const getElementBySelector = async (element, selector, timeoutDelay = 30, delay = 1.3) => {
  await sleep(delay);
  await element.waitForSelector(selector, {
    visible: true,
    timeout: timeoutDelay * 1000,
  });
  return await element.$$(selector);
};

let cntrlKey = process.platform === "win32" ? "Control" : "Meta";

export const selectAllHelper = async (page) => {
  await page.keyboard.down(cntrlKey);
  await page.keyboard.press("KeyA");
  await page.keyboard.up(cntrlKey);
};

export const copyHelper = async (page) => {
  await page.keyboard.down(cntrlKey);
  await page.keyboard.press("KeyC");
  await page.keyboard.up(cntrlKey);
};

export const pasteHelper = async (page) => {
  await page.keyboard.down(cntrlKey);
  await page.keyboard.press("KeyV");
  await page.keyboard.up(cntrlKey);
};