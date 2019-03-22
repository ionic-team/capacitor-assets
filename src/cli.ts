import { Options, PlatformOptions } from '.';
import { PLATFORMS, Platform, RunPlatformOptions, validatePlatforms } from './platform';
import { DEFAULT_RESOURCES_DIRECTORY, RESOURCE_TYPES, ResourceType, validateResourceTypes } from './resources';
import { getOptionValue } from './utils/cli';

export function parseOptions(args: ReadonlyArray<string>): Options {
  const platformArg = args[0] ? args[0] : undefined;
  const platformList = validatePlatforms(platformArg && !platformArg.startsWith('-') ? [platformArg] : PLATFORMS);
  const platforms: PlatformOptions = {};
  const resourcesDirectory = getOptionValue(args, '--resources', DEFAULT_RESOURCES_DIRECTORY);
  const json = args.includes('--json');

  return {
    directory: process.cwd(),
    resourcesDirectory,
    logstream: json ? process.stderr : process.stdout,
    errstream: process.stderr,
    platforms: platformList.reduce((acc, platform) => {
      acc[platform] = generateRunOptions(platform, resourcesDirectory, args);
      return acc;
    }, platforms),
  };
}

export function generateRunOptions(platform: Platform, resourcesDirectory: string, args: ReadonlyArray<string>): RunPlatformOptions {
  const typeOption = getOptionValue(args, '--type');
  const types = validateResourceTypes(typeOption ? [typeOption] : RESOURCE_TYPES);

  return {
    [ResourceType.ICON]: types.includes(ResourceType.ICON) ? parseIconOptions(platform, resourcesDirectory, args) : undefined,
    [ResourceType.SPLASH]: types.includes(ResourceType.SPLASH) ? parseSplashOptions(platform, resourcesDirectory, args) : undefined,
  };
}

export function parseIconOptions(platform: Platform, resourcesDirectory: string, args: ReadonlyArray<string>): RunPlatformOptions[ResourceType.ICON] {
  const iconSourceOption = getOptionValue(args, '--icon-source');
  const iconOptions: Partial<RunPlatformOptions[ResourceType.ICON]> = {};

  if (iconSourceOption) {
    iconOptions.sources = [iconSourceOption];
  }

  return { ...{ sources: [`${resourcesDirectory}/${platform}/icon.png`, `${resourcesDirectory}/icon.png`] }, ...iconOptions };
}

export function parseSplashOptions(platform: Platform, resourcesDirectory: string, args: ReadonlyArray<string>): RunPlatformOptions[ResourceType.SPLASH] {
  const splashSourceOption = getOptionValue(args, '--splash-source');
  const splashOptions: Partial<RunPlatformOptions[ResourceType.SPLASH]> = {};

  if (splashSourceOption) {
    splashOptions.sources = [splashSourceOption];
  }

  return { ...{ sources: [`${resourcesDirectory}/${platform}/splash.png`, `${resourcesDirectory}/splash.png`] }, ...splashOptions };
}
