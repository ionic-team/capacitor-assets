import { ensureDir } from '@ionic/utils-fs';
import Debug from 'debug';
import pathlib from 'path';

import { BadInputError, ResolveSourceImageError } from './error';
import { ImageSchema, debugSourceImage, generateImage, readSourceImage, resolveSourceImage } from './image';
import { COLOR_REGEX, ImageSourceData, ResolvedSource, ResourceKey, ResourceKeyValues, ResourceType, ResourcesTypeConfig, Source, SourceType, getResourcesConfig } from './resources';

const debug = Debug('cordova-res:platform');

export const enum Platform {
  ANDROID = 'android',
  IOS = 'ios',
}

export const PLATFORMS: ReadonlyArray<Platform> = [Platform.ANDROID, Platform.IOS];

export type Sources = (string | Source)[];

export interface GeneratedResource extends ResourceKeyValues {
  type: ResourceType;
  srckey: ResourceKey;
  platform: Platform;
  nodeName: string;
  nodeAttributes: ReadonlyArray<ResourceKey>;
}

export interface SimpleResourceOptions {
  sources: string[];
}

export interface SimpleResourceResult {
  resources: GeneratedResource[];
  source: ResolvedSource;
}

export interface AdaptiveIconResourceOptions {
  foreground: {
    sources: Sources;
  };
  background: {
    sources: Sources;
  };
}

export interface RunPlatformOptions {
  [ResourceType.ADAPTIVE_ICON]?: AdaptiveIconResourceOptions;
  [ResourceType.ICON]?: SimpleResourceOptions;
  [ResourceType.SPLASH]?: SimpleResourceOptions;
}

export interface RunPlatformResult {
  resources: GeneratedResource[];
  sources: ResolvedSource[];
}

/**
 * Run resource generation for the given platform.
 */
export async function run(platform: Platform, resourcesDirectory: string, options: Readonly<RunPlatformOptions>, errstream?: NodeJS.WritableStream): Promise<RunPlatformResult> {
  debug('Running %s platform with options: %O', platform, options);

  const resources: GeneratedResource[] = [];
  const sources: ResolvedSource[] = [];
  const adaptiveResult = await safelyGenerateAdaptiveIconResources(platform, resourcesDirectory, options[ResourceType.ADAPTIVE_ICON], errstream);

  if (adaptiveResult && adaptiveResult.resources.length > 0) {
    resources.push(...adaptiveResult.resources);
    sources.push(...adaptiveResult.sources);
  } else {
    const iconResult = await generateSimpleResources(ResourceType.ICON, platform, resourcesDirectory, options[ResourceType.ICON], errstream);

    if (iconResult) {
      resources.push(...iconResult.resources);
      sources.push(iconResult.source);
    }
  }

  const splashResult = await generateSimpleResources(ResourceType.SPLASH, platform, resourcesDirectory, options[ResourceType.SPLASH], errstream);

  if (splashResult) {
    resources.push(...splashResult.resources);
    sources.push(splashResult.source);
  }

  return {
    resources,
    sources,
  };
}

/**
 * Generate simple icons or splash screens.
 *
 * Icon and Splash Screen generation is "simple" because there's one source
 * image type and one set of resources to generate.
 *
 * If there are no options given for this resource, this function resolves
 * with `undefined`.
 */
export async function generateSimpleResources(type: ResourceType.ICON | ResourceType.SPLASH, platform: Platform, resourcesDirectory: string, options?: Readonly<SimpleResourceOptions>, errstream?: NodeJS.WritableStream): Promise<SimpleResourceResult | undefined> {
  if (!options) {
    return;
  }

  debug('Building %s resources for %s platform', type, platform);

  const source = await resolveSourceImage(type, options.sources, errstream);

  debug('Using %O for %s source image for %s', source.image.src, type, platform);

  const config = getResourcesConfig(platform, type);
  const resources = await Promise.all(config.resources.map(
    async (resource): Promise<GeneratedResource> => ({
      ...resource,
      ...await generateImageResource(type, platform, resourcesDirectory, config, source.image, resource, ResourceKey.SRC, errstream),
    })
  ));

  return {
    resources,
    source,
  };
}

/**
 * Attempt to generate Adaptive Icons for any platform.
 *
 * If there are no options given for this resource or if the platform or
 * source images are not suitable, this function resolves with `undefined`.
 */
export async function safelyGenerateAdaptiveIconResources(platform: Platform, resourcesDirectory: string, options?: Readonly<AdaptiveIconResourceOptions>, errstream?: NodeJS.WritableStream): Promise<RunPlatformResult | undefined> {
  if (platform !== Platform.ANDROID || !options) {
    return;
  }

  try {
    return await generateAdaptiveIconResources(resourcesDirectory, options, errstream);
  } catch (e) {
    debug('Error with adaptive icons: %O', e);

    if (!(e instanceof ResolveSourceImageError)) {
      throw e;
    }
  }
}

/**
 * Generate Android Adaptive Icons.
 */
export async function generateAdaptiveIconResources(resourcesDirectory: string, options: Readonly<AdaptiveIconResourceOptions>, errstream?: NodeJS.WritableStream): Promise<RunPlatformResult> {
  if (options.foreground.sources.length === 0 || options.background.sources.length === 0) {
    throw new BadInputError('Adaptive icons require sources for both foreground and background.');
  }

  const foregroundSources = options.foreground.sources
    .map(source => typeof source === 'string' ? source : source.type === SourceType.RASTER ? source.src : undefined)
    .filter((source): source is string => typeof source === 'string');

  if (foregroundSources.length === 0) {
    throw new BadInputError('Adaptive icon foreground source must be an image.');
  }

  debug('Building %s resources', ResourceType.ADAPTIVE_ICON);

  const { resources: foregroundResources, source: foregroundSource } = await generateAdaptiveIconType(resourcesDirectory, foregroundSources, ResourceKey.FOREGROUND, errstream);
  const resolvedBackgroundSource = await resolveSource(ResourceType.ADAPTIVE_ICON, ResourceKey.BACKGROUND, options.background.sources, errstream);
  const config = getResourcesConfig(Platform.ANDROID, ResourceType.ADAPTIVE_ICON);

  const resources = resolvedBackgroundSource.type === SourceType.RASTER
    ? await Promise.all(foregroundResources.map(async resource => {
        const { background, format, width, height } = resource;

        if (!background || !format || !width || !height) {
          throw new BadInputError(`Bad adaptive icon image schema: (background: ${background}, format: ${format}, width: ${width}, height: ${height})`);
        }

        const backgroundResource = await generateImageResource(ResourceType.ADAPTIVE_ICON, Platform.ANDROID, resourcesDirectory, config, resolvedBackgroundSource.image, { src: background, format, width, height }, ResourceKey.BACKGROUND, errstream);

        return { ...resource, background: backgroundResource.background };
      }))
    : foregroundResources.map(resource => ({ ...resource, background: '@color/background' }));

  return {
    resources,
    sources: [foregroundSource, resolvedBackgroundSource],
  };
}

/**
 * Generate the foreground or background portion of Adaptive Icons.
 */
export async function generateAdaptiveIconType(resourcesDirectory: string, sources: string[], type: ResourceKey.FOREGROUND | ResourceKey.BACKGROUND, errstream?: NodeJS.WritableStream): Promise<SimpleResourceResult> {
  const source = await resolveSourceImage(ResourceType.ADAPTIVE_ICON, sources, errstream);

  debug('Using %O for %s source image for %s', source.image.src, ResourceType.ADAPTIVE_ICON, Platform.ANDROID);

  const config = getResourcesConfig(Platform.ANDROID, ResourceType.ADAPTIVE_ICON);

  const resources = await Promise.all(config.resources.map(async (resource): Promise<GeneratedResource> => ({
    ...resource,
    ...await generateImageResource(
      ResourceType.ADAPTIVE_ICON,
      Platform.ANDROID,
      resourcesDirectory,
      config,
      source.image,
      { ...resource, src: resource[type] },
      type,
      errstream
    ),
  })));

  return {
    resources,
    source,
  };
}

export async function generateImageResource(type: ResourceType, platform: Platform, resourcesDirectory: string, config: ResourcesTypeConfig<unknown>, image: ImageSourceData, schema: ImageSchema, key: ResourceKey, errstream?: NodeJS.WritableStream): Promise<GeneratedResource> {
  const { pipeline, metadata } = image;
  const { src, format, width, height } = schema;

  const dest = pathlib.join(resourcesDirectory, src);
  await ensureDir(pathlib.dirname(dest));
  await generateImage({ src: dest, format, width, height }, pipeline.clone(), metadata, errstream);

  return {
    type,
    format,
    width,
    height,
    srckey: key,
    [key]: dest,
    platform,
    nodeName: config.nodeName,
    nodeAttributes: config.nodeAttributes,
  };
}

export async function resolveSource(type: ResourceType, name: string, sources: Sources, errstream?: NodeJS.WritableStream): Promise<ResolvedSource> {
  for (const source of sources) {
    if (typeof source === 'string' || source.type === SourceType.RASTER) {
      const src = typeof source === 'string' ? source : source.src;

      try {
        return await readSourceImage(type, src);
      } catch (e) {
        debugSourceImage(src, e, errstream);
      }
    } else if (source.type === SourceType.COLOR) {
      const color = source.color.toUpperCase();

      if (!color.match(COLOR_REGEX)) {
        throw new BadInputError(`Color ${color} does not match regex ${COLOR_REGEX}.`);
      }

      return { type: SourceType.COLOR, name, color };
    }
  }

  throw new BadInputError(`Missing source for "${type}" (sources: ${sources.join(', ')})`);
}

export function validatePlatforms(platforms: ReadonlyArray<string>): Platform[] {
  const result: Platform[] = [];

  for (const platform of platforms) {
    if (!isSupportedPlatform(platform)) {
      throw new BadInputError(`Unsupported platform: ${platform}`);
    }

    result.push(platform);
  }

  return result;
}

export function isSupportedPlatform(platform: any): platform is Platform {
  return PLATFORMS.includes(platform);
}
