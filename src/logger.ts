const LOG_ENABLED = process.env.LOG_ENABLED
  ? process.env.LOG_ENABLED === 'true'
  : false;

const logPrefix = {
  info: '[INFO]',
  warn: '[WARN]',
  error: '[ERROR]',
  debug: '[DEBUG]',
  system: '[SYSTEM]',
};

export const Logger = {
  info: (...args: any[]) => {
    if (LOG_ENABLED) console.info(logPrefix.info, ...args);
  },
  warn: (...args: any[]) => {
    if (LOG_ENABLED) console.warn(logPrefix.warn, ...args);
  },
  error: (...args: any[]) => {
    if (LOG_ENABLED) console.error(logPrefix.error, ...args);
  },
  debug: (...args: any[]) => {
    if (LOG_ENABLED) console.debug(logPrefix.debug, ...args);
  },
  system: (...args: any[]) => {
    console.error(logPrefix.system, ...args);
  },
};
