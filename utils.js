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