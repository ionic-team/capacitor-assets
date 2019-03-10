import { Options, PlatformOptions } from '.';
import { PLATFORMS, Platform, RunPlatformOptions, validatePlatforms } from './platform';
import { RESOURCE_TYPES, ResourceType, validateResourceTypes } from './resources';
import { getOptionValue } from './utils/cli';

export function parseOptions(args: ReadonlyArray<string>): Options {
  const platformArg = args[0] ? args[0] : undefined;
  const platformList = validatePlatforms(platformArg && !platformArg.startsWith('-') ? [platformArg] : PLATFORMS);
  const platforms: PlatformOptions = {};

  return {
    logstream: process.stdout,
    platforms: platformList.reduce((acc, platform) => {
      acc[platform] = generateRunOptions(platform, args);
      return acc;
    }, platforms),
  };
}

export function generateRunOptions(platform: Platform, args: ReadonlyArray<string>): RunPlatformOptions {
  const typeOption = getOptionValue(args, '--type');
  const types = validateResourceTypes(typeOption ? [typeOption] : RESOURCE_TYPES);

  return {
    [ResourceType.ICON]: types.includes(ResourceType.ICON) ? parseIconOptions(platform, args) : undefined,
    [ResourceType.SPLASH]: types.includes(ResourceType.SPLASH) ? parseSplashOptions(platform, args) : undefined,
  };
}

export function parseIconOptions(platform: Platform, args: ReadonlyArray<string>): RunPlatformOptions[ResourceType.ICON] {
  const iconSourceOption = getOptionValue(args, '--icon-source');
  const iconOptions: Partial<RunPlatformOptions[ResourceType.ICON]> = {};

  if (iconSourceOption) {
    iconOptions.sources = [iconSourceOption];
  }

  return { ...{ sources: [`resources/${platform}/icon.png`, 'resources/icon.png'] }, ...iconOptions };
}

export function parseSplashOptions(platform: Platform, args: ReadonlyArray<string>): RunPlatformOptions[ResourceType.SPLASH] {
  const splashSourceOption = getOptionValue(args, '--splash-source');
  const splashOptions: Partial<RunPlatformOptions[ResourceType.SPLASH]> = {};

  if (splashSourceOption) {
    splashOptions.sources = [splashSourceOption];
  }

  return { ...{ sources: [`resources/${platform}/splash.png`, 'resources/splash.png'] }, ...splashOptions };
}
