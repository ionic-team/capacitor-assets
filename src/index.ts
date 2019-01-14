import * as Debug from 'debug';
import * as path from 'path';

import { isSupportedPlatform, runPlatform } from './platform';
import { Platform, RESOURCES } from './resources';

const debug = Debug('cordova-res');

export async function run(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--version')) {
    const pkg = await import(path.resolve(__dirname, '../package.json'));
    process.stdout.write(pkg.version + '\n');
    return;
  }

  const [ platform ] = args;

  try {
    if (isSupportedPlatform(platform)) {
      await runPlatform(platform);
    } else {
      if (platform === 'help' || args.includes('--help') || args.includes('-h')) {
        const help = await import('./help');
        return help.run();
      }

      for (const plt of Object.keys(RESOURCES)) {
        await runPlatform(plt as Platform); // TODO
      }
    }
  } catch (e) {
    debug('Caught fatal error: %O', e);
    process.exitCode = 1;
    process.stdout.write(e.stack ? e.stack : e.toString());
  }
}
