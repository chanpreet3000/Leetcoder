import chalk from "chalk";

class Logger {
  static logMessage(type, message, obj = null) {
    const timestamp = new Date().toISOString();
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
