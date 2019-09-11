import Debug from 'debug';

const debug = Debug('cordova-res:utils:fn');

export async function tryFn<T>(fn: (() => Promise<T>)): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    debug('Encountered error when trying function: %O', fn);
  }
}
