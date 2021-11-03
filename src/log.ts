import chalk from 'chalk';

export function log(...args: any[]) {
  console.log(...args);
}

export function warn(...args: any[]) {
  console.warn(...args);
}

export function error(...args: any[]) {
  console.warn(...args);
}

export function fatal(msg: string, exc?: any) {
  console.error(chalk`{red.bold Fatal error: ${msg}}`);
  if (exc) {
    console.error(exc);
  }
  process.exit(1);
}
