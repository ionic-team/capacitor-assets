import * as Debug from 'debug';
import * as path from 'path';

import { RunPlatformOptions, runPlatform, validatePlatforms, validateResourceTypes } from './platform';
import { PLATFORMS, RESOURCE_TYPES, ResourceType } from './resources';
import { getOptionValue } from './utils/cli';

const debug = Debug('cordova-res');

export async function run(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--version')) {
    const pkg = await import(path.resolve(__dirname, '../package.json'));
    process.stdout.write(pkg.version + '\n');
    return;
  }

  if (args[0] === 'help' || args.includes('--help') || args.includes('-h')) {
    const help = await import('./help');
    return help.run();
  }

  const platformArg = args[0] ? args[0].toString() : undefined;
  const typeOption = getOptionValue(args, '--type');

  try {
    const platforms = validatePlatforms(platformArg && !platformArg.startsWith('-') ? [platformArg] : PLATFORMS);
    const types = validateResourceTypes(typeOption ? [typeOption] : RESOURCE_TYPES);

    for (const platform of platforms) {
      await runPlatform(platform, types, generateRunOptions(args));
    }
  } catch (e) {
    debug('Caught fatal error: %O', e);
    process.exitCode = 1;
    process.stdout.write(e.stack ? e.stack : e.toString());
  }
}

const DEFAULT_ICON_OPTIONS = Object.freeze({ source: 'resources/icon.png' });
const DEFAULT_SPLASH_OPTIONS = Object.freeze({ source: 'resources/splash.png' });

export function generateRunOptions(args: ReadonlyArray<string>): RunPlatformOptions {
  const iconSourceOption = getOptionValue(args, '--icon-source');
  const splashSourceOption = getOptionValue(args, '--splash-source');

  const iconOptions: Partial<RunPlatformOptions[ResourceType.ICON]> = {};
  const splashOptions: Partial<RunPlatformOptions[ResourceType.SPLASH]> = {};

  if (iconSourceOption) {
    iconOptions.source = iconSourceOption;
  }

  if (splashSourceOption) {
    splashOptions.source = splashSourceOption;
  }

  return {
    [ResourceType.ICON]: { ...DEFAULT_ICON_OPTIONS, ...iconOptions },
    [ResourceType.SPLASH]: { ...DEFAULT_SPLASH_OPTIONS, ...splashOptions },
  };
}
