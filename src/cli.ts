import type et from 'elementtree';

import type {
  NativeProjectConfigByPlatform,
  Options,
  PlatformOptions,
} from '.';
import { getPlatforms } from './cordova/config';
import { BadInputError } from './error';
import type { ResizeOptions } from './image';
import { validateFit, validatePosition } from './image';
import type { NativeProjectConfig } from './native';
import type {
  AdaptiveIconResourceOptions,
  RunPlatformOptions,
  SimpleResourceOptions,
} from './platform';
import {
  PLATFORMS,
  Platform,
  filterSupportedPlatforms,
  validatePlatforms,
} from './platform';
import type { Source } from './resources';
import {
  RESOURCE_TYPES,
  ResourceKey,
  ResourceType,
  SourceType,
  validateResourceTypes,
} from './resources';
import { getOptionValue } from './utils/cli';

export const DEFAULT_RESOURCES_DIRECTORY = 'resources';
export const DEFAULT_FIT = 'cover';
export const DEFAULT_POSITION = 'center';

export function getDirectory(): string {
  return process.cwd();
}

export async function resolveOptions(
  args: readonly string[],
  config?: et.ElementTree,
): Promise<Options> {
  const doc = config ? config.getroot() : undefined;
  const platform = parsePlatformOption(args);
  const platformList = validatePlatforms(
    platform
      ? [platform]
      : filterSupportedPlatforms(doc ? getPlatforms(doc) : []),
  );
  const parsedOptions = parseOptions(args);
  const { resourcesDirectory } = parsedOptions;

  return {
    ...parsedOptions,
    ...(platformList.length > 0
      ? {
          platforms: generatePlatformOptions(
            platformList,
            resourcesDirectory,
            args,
          ),
        }
      : {}),
  };
}

export function parseOptions(args: readonly string[]): Required<Options> {
  const json = args.includes('--json');
  const platform = parsePlatformOption(args);
  const platformList = validatePlatforms(platform ? [platform] : PLATFORMS);
  const resourcesDirectory = parseResourcesDirectoryOption(args);

  return {
    directory: getDirectory(),
    resourcesDirectory,
    logstream: json ? process.stderr : process.stdout,
    errstream: process.stderr,
    platforms: generatePlatformOptions(platformList, resourcesDirectory, args),
    projectConfig: generatePlatformProjectOptions(platformList, args),
    skipConfig: parseSkipConfigOption(args),
    copy: parseCopyOption(args),
    operations: parseResizeOptions(args),
  };
}

export function parseResourcesDirectoryOption(args: readonly string[]): string {
  return getOptionValue(args, '--resources', DEFAULT_RESOURCES_DIRECTORY);
}

export function parseResizeOptions(args: readonly string[]): ResizeOptions {
  const fit = validateFit(getOptionValue(args, '--fit', DEFAULT_FIT));
  const position = validatePosition(
    fit,
    getOptionValue(args, '--position', DEFAULT_POSITION),
  );

  return { fit, position };
}

export function parsePlatformOption(
  args: readonly string[],
): string | undefined {
  const [platform] = args;

  if (!platform || platform.startsWith('-')) {
    return;
  }

  return platform;
}

export function generatePlatformOptions(
  platforms: readonly Platform[],
  resourcesDirectory: string,
  args: readonly string[],
): PlatformOptions {
  return platforms.reduce((acc, platform) => {
    acc[platform] = generateRunOptions(platform, resourcesDirectory, args);
    return acc;
  }, {} as PlatformOptions);
}

export function generatePlatformProjectOptions(
  platforms: readonly Platform[],
  args: readonly string[],
): NativeProjectConfigByPlatform {
  return platforms.reduce((acc, platform) => {
    acc[platform] = generateNativeProjectConfig(platform, args);
    return acc;
  }, {} as NativeProjectConfigByPlatform);
}

export function generateRunOptions(
  platform: Platform,
  resourcesDirectory: string,
  args: readonly string[],
): RunPlatformOptions {
  const typeOption = getOptionValue(args, '--type');
  const types = validateResourceTypes(
    typeOption ? [typeOption] : RESOURCE_TYPES,
  );

  return {
    [ResourceType.ADAPTIVE_ICON]: types.includes(ResourceType.ADAPTIVE_ICON)
      ? parseAdaptiveIconResourceOptions(platform, resourcesDirectory, args)
      : undefined,
    [ResourceType.ICON]: types.includes(ResourceType.ICON)
      ? parseSimpleResourceOptions(
          platform,
          ResourceType.ICON,
          resourcesDirectory,
          args,
        )
      : undefined,
    [ResourceType.SPLASH]: types.includes(ResourceType.SPLASH)
      ? parseSimpleResourceOptions(
          platform,
          ResourceType.SPLASH,
          resourcesDirectory,
          args,
        )
      : undefined,
  };
}

export function generateNativeProjectConfig(
  platform: Platform,
  args: readonly string[],
): NativeProjectConfig {
  const directory = getOptionValue(args, `--${platform}-project`, platform);

  return { directory };
}

export function parseCopyOption(args: readonly string[]): boolean {
  return args.includes('--copy');
}

export function parseSkipConfigOption(args: readonly string[]): boolean {
  return args.includes('--skip-config');
}

export function parseAdaptiveIconResourceOptions(
  platform: Platform,
  resourcesDirectory: string,
  args: readonly string[],
): AdaptiveIconResourceOptions | undefined {
  if (platform !== Platform.ANDROID) {
    return;
  }

  return {
    icon: parseSimpleResourceOptions(
      platform,
      ResourceType.ICON,
      resourcesDirectory,
      args,
    ),
    foreground: parseAdaptiveIconForegroundOptions(resourcesDirectory, args),
    background: parseAdaptiveIconBackgroundOptions(resourcesDirectory, args),
  };
}

export function parseAdaptiveIconForegroundOptions(
  resourcesDirectory: string,
  args: readonly string[],
): AdaptiveIconResourceOptions['foreground'] {
  const source = parseAdaptiveIconSourceFromArgs(ResourceKey.FOREGROUND, args);

  if (source && source.type !== SourceType.RASTER) {
    throw new BadInputError('Adaptive icon foreground must be an image.');
  }

  return {
    sources: source
      ? [source]
      : getDefaultAdaptiveIconSources(
          ResourceKey.FOREGROUND,
          resourcesDirectory,
        ),
  };
}

export function parseAdaptiveIconBackgroundOptions(
  resourcesDirectory: string,
  args: readonly string[],
): AdaptiveIconResourceOptions['background'] {
  const source = parseAdaptiveIconSourceFromArgs(ResourceKey.BACKGROUND, args);

  return {
    sources: source
      ? [source]
      : getDefaultAdaptiveIconSources(
          ResourceKey.BACKGROUND,
          resourcesDirectory,
        ),
  };
}

export function parseSimpleResourceOptions(
  platform: Platform,
  type: ResourceType.ICON | ResourceType.SPLASH,
  resourcesDirectory: string,
  args: readonly string[],
): SimpleResourceOptions {
  const source = parseSourceFromArgs(type, args);

  return {
    sources: source
      ? [source]
      : getDefaultSources(platform, type, resourcesDirectory),
  };
}

export function parseAdaptiveIconSourceFromArgs(
  type: ResourceKey.FOREGROUND | ResourceKey.BACKGROUND,
  args: readonly string[],
): Source | undefined {
  const sourceOption = getOptionValue(args, `--icon-${type}-source`);

  if (!sourceOption) {
    return;
  }

  return parseSource(sourceOption);
}

export function parseSourceFromArgs(
  type: ResourceType.ICON | ResourceType.SPLASH,
  args: readonly string[],
): string | undefined {
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

export function getDefaultSources(
  platform: Platform,
  type: ResourceType,
  resourcesDirectory: string,
): string[] {
  return [
    `${resourcesDirectory}/${platform}/${type}.png`,
    `${resourcesDirectory}/${platform}/${type}.jpg`,
    `${resourcesDirectory}/${platform}/${type}.jpeg`,
    `${resourcesDirectory}/${type}.png`,
    `${resourcesDirectory}/${type}.jpg`,
    `${resourcesDirectory}/${type}.jpeg`,
  ];
}

export function getDefaultAdaptiveIconSources(
  type: ResourceKey.FOREGROUND | ResourceKey.BACKGROUND,
  resourcesDirectory: string,
): string[] {
  return [
    `${resourcesDirectory}/android/icon-${type}.png`,
    `${resourcesDirectory}/android/icon-${type}.jpg`,
    `${resourcesDirectory}/android/icon-${type}.jpeg`,
  ];
}
