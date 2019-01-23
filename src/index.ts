import * as Debug from 'debug';
import * as path from 'path';

import { read as readConfig, run as runConfig, write as writeConfig } from './config';
import { GeneratedImage, PLATFORMS, Platform, RunPlatformOptions, run as runPlatform, validatePlatforms } from './platform';
import { RESOURCE_TYPES, ResourceType, validateResourceTypes } from './resources';
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

  const configPath = 'config.xml';
  const platformArg = args[0] ? args[0].toString() : undefined;
  const typeOption = getOptionValue(args, '--type');

  try {
    const platforms = validatePlatforms(platformArg && !platformArg.startsWith('-') ? [platformArg] : PLATFORMS);
    const types = validateResourceTypes(typeOption ? [typeOption] : RESOURCE_TYPES);
    const config = await readConfig(configPath);
    const images: GeneratedImage[] = [];

    for (const platform of platforms) {
      const platformImages = await runPlatform(platform, types, generateRunOptions(platform, args));
      process.stdout.write(`Generated ${platformImages.length} images for ${platform}\n`);
      images.push(...platformImages);
    }

    runConfig(images, config);
    await writeConfig(configPath, config);
    process.stdout.write(`Wrote to config.xml\n`);
  } catch (e) {
    debug('Caught fatal error: %O', e);
    process.exitCode = 1;
    process.stdout.write(e.stack ? e.stack : e.toString());
  }
}

export function generateRunOptions(platform: Platform, args: ReadonlyArray<string>): RunPlatformOptions {
  const iconSourceOption = getOptionValue(args, '--icon-source');
  const splashSourceOption = getOptionValue(args, '--splash-source');

  const iconOptions: Partial<RunPlatformOptions[ResourceType.ICON]> = {};
  const splashOptions: Partial<RunPlatformOptions[ResourceType.SPLASH]> = {};

  if (iconSourceOption) {
    iconOptions.sources = [iconSourceOption];
  }

  if (splashSourceOption) {
    splashOptions.sources = [splashSourceOption];
  }

  return {
    [ResourceType.ICON]: { ...{ sources: [`resources/${platform}/icon.png`, 'resources/icon.png'] }, ...iconOptions },
    [ResourceType.SPLASH]: { ...{ sources: [`resources/${platform}/splash.png`, 'resources/splash.png'] }, ...splashOptions },
  };
}
