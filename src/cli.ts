import et from 'elementtree';

import type { NativeProjectConfigByPlatform, Options, PlatformOptions } from '.';
import { getPlatforms } from './cordova/config';
import { BadInputError } from './error';
import { NativeProjectConfig } from './native';
import { AdaptiveIconResourceOptions, PLATFORMS, Platform, RunPlatformOptions, SimpleResourceOptions, filterSupportedPlatforms, validatePlatforms } from './platform';
import { DEFAULT_RESOURCES_DIRECTORY, RESOURCE_TYPES, ResourceKey, ResourceType, Source, SourceType, validateResourceTypes } from './resources';
import { getOptionValue } from './utils/cli';

export function getDirectory(): string {
  return process.cwd();
}

export async function resolveOptions(args: readonly string[], directory: string, config?: et.ElementTree): Promise<Options> {
  const doc = config ? config.getroot() : undefined;
  const platformList = filterSupportedPlatforms(doc ? getPlatforms(doc) : []);
  const parsedOptions = parseOptions(args);
  const { resourcesDirectory = DEFAULT_RESOURCES_DIRECTORY } = parsedOptions;
  const platformOption = parsePlatformOption(args);

  return {
  ...{
      directory,
      ...parsedOptions,
      platforms: platformOption ? parsedOptions.platforms : generatePlatformOptions(platformList, resourcesDirectory, args),
    },
  };
}

export function parseOptions(args: readonly string[]): Required<Options> {
  const json = args.includes('--json');
  const resourcesDirectory = getOptionValue(args, '--resources', DEFAULT_RESOURCES_DIRECTORY);
  const platformArg = parsePlatformOption(args);
  const platformList = validatePlatforms(platformArg && !platformArg.startsWith('-') ? [platformArg] : PLATFORMS);

  return {
    directory: getDirectory(),
    resourcesDirectory,
    logstream: json ? process.stderr : process.stdout,
    errstream: process.stderr,
    platforms: generatePlatformOptions(platformList, resourcesDirectory, args),
    projectConfig: generatePlatformProjectOptions(platformList, args),
    skipConfig: parseSkipConfigOption(args),
    copy: parseCopyOption(args),
  };
}

export function parsePlatformOption(args: readonly string[]): string | undefined {
  return args[0] ? args[0] : undefined;
}

export function generatePlatformOptions(platforms: readonly Platform[], resourcesDirectory: string, args: readonly string[]): PlatformOptions {
  return platforms.reduce((acc, platform) => {
    acc[platform] = generateRunOptions(platform, resourcesDirectory, args);
    return acc;
  }, {} as PlatformOptions);
}

export function generatePlatformProjectOptions(platforms: readonly Platform[], args: readonly string[]): NativeProjectConfigByPlatform {
  return platforms.reduce((acc, platform) => {
    acc[platform] = generateNativeProjectConfig(platform, args);
    return acc;
  }, {} as NativeProjectConfigByPlatform);
}

export function generateRunOptions(platform: Platform, resourcesDirectory: string, args: readonly string[]): RunPlatformOptions {
  const typeOption = getOptionValue(args, '--type');
  const types = validateResourceTypes(typeOption ? [typeOption] : RESOURCE_TYPES);

  return {
    [ResourceType.ADAPTIVE_ICON]: types.includes(ResourceType.ADAPTIVE_ICON) ? parseAdaptiveIconResourceOptions(platform, resourcesDirectory, args) : undefined,
    [ResourceType.ICON]: types.includes(ResourceType.ICON) ? parseSimpleResourceOptions(platform, ResourceType.ICON, resourcesDirectory, args) : undefined,
    [ResourceType.SPLASH]: types.includes(ResourceType.SPLASH) ? parseSimpleResourceOptions(platform, ResourceType.SPLASH, resourcesDirectory, args) : undefined,
  };
}

export function generateNativeProjectConfig(platform: Platform, args: readonly string[]): NativeProjectConfig {
  const directory = getOptionValue(args, `--${platform}-project`, platform);

  return { directory };
}

export function parseCopyOption(args: readonly string[]): boolean {
  return args.includes('--copy');
}

export function parseSkipConfigOption(args: readonly string[]): boolean {
  return args.includes('--skip-config');
}

export function parseAdaptiveIconResourceOptions(platform: Platform, resourcesDirectory: string, args: readonly string[]): AdaptiveIconResourceOptions | undefined {
  if (platform !== Platform.ANDROID) {
    return;
  }

  return {
    icon: parseSimpleResourceOptions(platform, ResourceType.ICON, resourcesDirectory, args),
    foreground: parseAdaptiveIconForegroundOptions(resourcesDirectory, args),
    background: parseAdaptiveIconBackgroundOptions(resourcesDirectory, args),
  };
}

export function parseAdaptiveIconForegroundOptions(resourcesDirectory: string, args: readonly string[]): AdaptiveIconResourceOptions['foreground'] {
  const source = parseAdaptiveIconSourceFromArgs(ResourceKey.FOREGROUND, args);

  if (source && source.type !== SourceType.RASTER) {
    throw new BadInputError('Adaptive icon foreground must be an image.');
  }

  return {
    sources: source
      ? [source]
      : getDefaultAdaptiveIconSources(ResourceKey.FOREGROUND, resourcesDirectory),
  };
}

export function parseAdaptiveIconBackgroundOptions(resourcesDirectory: string, args: readonly string[]): AdaptiveIconResourceOptions['background'] {
  const source = parseAdaptiveIconSourceFromArgs(ResourceKey.BACKGROUND, args);

  return {
    sources: source
      ? [source]
      : getDefaultAdaptiveIconSources(ResourceKey.BACKGROUND, resourcesDirectory),
  };
}

export function parseSimpleResourceOptions(platform: Platform, type: ResourceType.ICON | ResourceType.SPLASH, resourcesDirectory: string, args: readonly string[]): SimpleResourceOptions {
  const source = parseSourceFromArgs(type, args);

  return { sources: source ? [source] : getDefaultSources(platform, type, resourcesDirectory) };
}

export function parseAdaptiveIconSourceFromArgs(type: ResourceKey.FOREGROUND | ResourceKey.BACKGROUND, args: readonly string[]): Source | undefined {
  const sourceOption = getOptionValue(args, `--icon-${type}-source`);

  if (!sourceOption) {
    return;
  }

  return parseSource(sourceOption);
}

export function parseSourceFromArgs(type: ResourceType.ICON | ResourceType.SPLASH, args: readonly string[]): string | undefined {
  const sourceOption = getOptionValue(args, `--${type}-source`);

  if (sourceOption) {
    return sourceOption;
  }
}

export function parseSource(sourceOption: string): Source {
  return sourceOption.startsWith('#')
    ? { type: SourceType.COLOR, color: sourceOption }
    : { type: SourceType.RASTER, src: sourceOption };
}

export function getDefaultSources(platform: Platform, type: ResourceType, resourcesDirectory: string): string[] {
  return [
    `${resourcesDirectory}/${platform}/${type}.png`,
    `${resourcesDirectory}/${platform}/${type}.jpg`,
    `${resourcesDirectory}/${platform}/${type}.jpeg`,
    `${resourcesDirectory}/${type}.png`,
    `${resourcesDirectory}/${type}.jpg`,
    `${resourcesDirectory}/${type}.jpeg`,
  ];
}

export function getDefaultAdaptiveIconSources(type: ResourceKey.FOREGROUND | ResourceKey.BACKGROUND, resourcesDirectory: string): string[] {
  return [
    `${resourcesDirectory}/android/icon-${type}.png`,
    `${resourcesDirectory}/android/icon-${type}.jpg`,
    `${resourcesDirectory}/android/icon-${type}.jpeg`,
  ];
}
