import chalk from "chalk";

class Logger {
  static #timestampFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  static #getTimestamp() {
    const parts = Object.fromEntries(
      this.#timestampFormatter
        .formatToParts(new Date())
        .filter(({ type }) => type !== "literal")
        .map(({ type, value }) => [type, value]),
    );

    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} IST`;
  }

  static logMessage(type, message, obj = null) {
    const timestamp = this.#getTimestamp();
    let log = `[${timestamp}]\t${message}`;

    if (type === 'error' && obj instanceof Error) {
      log += `\nStack Trace: ${obj.stack}`;
    } else if (obj) {
      log += ` ${JSON.stringify(obj)}`;
    }

    switch (type) {
      case 'success':
        console.log(chalk.green(log));
        break;
      case 'error':
        console.error(chalk.red(log));
        break;
      case 'warn':
        console.warn(chalk.yellow(log));
        break;
      default:
        console.log(log);
    }
  }

  static success(message, obj = null) {
    this.logMessage('success', message, obj);
  }

  static error(message, obj = null) {
    this.logMessage('error', message, obj);
  }

  static warn(message, obj = null) {
    this.logMessage('warn', message, obj);
  }
}

export default Logger;
