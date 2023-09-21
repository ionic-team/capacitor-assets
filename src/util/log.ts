import {
  LOGGER_LEVELS,
  StreamOutputStrategy,
  TTYOutputStrategy,
  createDefaultLogger,
} from '@ionic/cli-framework-output';

import c from '../colors';

import { isInteractive } from './term';

const options = {
  colors: c,
  stream: process.argv.includes('--json') ? process.stderr : process.stdout,
};

export const output = isInteractive() ? new TTYOutputStrategy(options) : new StreamOutputStrategy(options);

export const logger = createDefaultLogger({
  output,
  formatterOptions: {
    titleize: false,
    tags: new Map([
      [LOGGER_LEVELS.DEBUG, c.log.DEBUG('[debug]')],
      [LOGGER_LEVELS.INFO, c.log.INFO('[info]')],
      [LOGGER_LEVELS.WARN, c.log.WARN('[warn]')],
      [LOGGER_LEVELS.ERROR, c.log.ERROR('[error]')],
    ]),
  },
});

export function debug(...args: any[]): void {
  if (process.env.VERBOSE !== 'false') {
    console.log(...args);
  }
}
export function log(...args: any[]): void {
  console.log(...args);
}

export function warn(...args: any[]): void {
  console.warn(...args);
}

export function error(...args: any[]): void {
  console.error(...args);
}

export function fatal(msg: string, exc?: Error): never {
  console.error(c.failure(`Fatal error: ${msg}`));
  console.log('ERROR', msg, exc);
  if (exc) {
    console.error(exc);
  }
  process.exit(1);
}
