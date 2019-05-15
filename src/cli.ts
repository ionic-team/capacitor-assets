import { Options, PlatformOptions } from '.';
import { BadInputError } from './error';
import { AndroidAdaptiveIconsRunOptions, PLATFORMS, Platform, ResourceTypeRunOptions, RunPlatformOptions, validatePlatforms } from './platform';
import { DEFAULT_RESOURCES_DIRECTORY, RESOURCE_TYPES, ResourceKey, ResourceType, Source, SourceType, validateResourceTypes } from './resources';
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
    [ResourceType.ADAPTIVE_ICON]: types.includes(ResourceType.ADAPTIVE_ICON) ? parseAdaptiveIconOptions(platform, resourcesDirectory, args) : undefined,
    [ResourceType.ICON]: types.includes(ResourceType.ICON) ? parseIconOptions(platform, resourcesDirectory, args) : undefined,
    [ResourceType.SPLASH]: types.includes(ResourceType.SPLASH) ? parseSplashOptions(platform, resourcesDirectory, args) : undefined,
  };
}

export function parseAdaptiveIconOptions(platform: Platform, resourcesDirectory: string, args: ReadonlyArray<string>): AndroidAdaptiveIconsRunOptions | undefined {
  if (platform !== Platform.ANDROID) {
    return;
  }

  return {
    foreground: parseAdaptiveIconTypeOptions(ResourceKey.FOREGROUND, resourcesDirectory, args),
    background: parseAdaptiveIconTypeOptions(ResourceKey.BACKGROUND, resourcesDirectory, args),
  };
}

export function parseAdaptiveIconTypeOptions(type: ResourceKey.FOREGROUND | ResourceKey.BACKGROUND, resourcesDirectory: string, args: ReadonlyArray<string>): AndroidAdaptiveIconsRunOptions[typeof type] {
  const sourceOption = getOptionValue(args, `--icon-${type}-source`);
  const options: Partial<AndroidAdaptiveIconsRunOptions[typeof type]> = {};

  if (sourceOption) {
    const source: Source = sourceOption.startsWith('#')
      ? { type: SourceType.COLOR, color: sourceOption }
      : { type: SourceType.RASTER, src: sourceOption };

    if (type === ResourceKey.FOREGROUND && source.type !== SourceType.RASTER) {
      throw new BadInputError('Adaptive icon foreground must be an image.');
    }

    options.sources = [source];
  }

  return {
    sources: [
      `${resourcesDirectory}/android/icon-${type}.png`,
      `${resourcesDirectory}/android/icon-${type}.jpg`,
      `${resourcesDirectory}/android/icon-${type}.jpeg`,
    ],
    ...options,
  };
}

export function parseIconOptions(platform: Platform, resourcesDirectory: string, args: ReadonlyArray<string>): ResourceTypeRunOptions {
  const sourceOption = getOptionValue(args, '--icon-source');
  const options: Partial<ResourceTypeRunOptions> = {};

  if (sourceOption) {
    options.sources = [sourceOption];
  }

  return {
    ...{
      sources: [
        `${resourcesDirectory}/${platform}/icon.png`,
        `${resourcesDirectory}/${platform}/icon.jpg`,
        `${resourcesDirectory}/${platform}/icon.jpeg`,
        `${resourcesDirectory}/icon.png`,
        `${resourcesDirectory}/icon.jpg`,
        `${resourcesDirectory}/icon.jpeg`,
      ],
    },
    ...options,
  };
}

export function parseSplashOptions(platform: Platform, resourcesDirectory: string, args: ReadonlyArray<string>): ResourceTypeRunOptions {
  const sourceOption = getOptionValue(args, '--splash-source');
  const options: Partial<ResourceTypeRunOptions> = {};

  if (sourceOption) {
    options.sources = [sourceOption];
  }

  return {
    ...{
      sources: [
        `${resourcesDirectory}/${platform}/splash.png`,
        `${resourcesDirectory}/${platform}/splash.jpg`,
        `${resourcesDirectory}/${platform}/splash.jpeg`,
        `${resourcesDirectory}/splash.png`,
        `${resourcesDirectory}/splash.jpg`,
        `${resourcesDirectory}/splash.jpeg`,
      ],
    },
    ...options,
  };
}
