import { ensureDir } from '@ionic/utils-fs';
import Debug from 'debug';
import pathlib from 'path';

import { BadInputError, ResolveSourceImageError } from './error';
import { ImageSchema, debugSourceImage, generateImage, readSourceImage, resolveSourceImage } from './image';
import { COLOR_REGEX, ColorSource, ImageSource, ImageSourceData, ResolvedImageSource, ResolvedSource, ResourceKey, ResourceKeyValues, ResourceNodeAttribute, ResourceType, ResourcesTypeConfig, SourceType, getResourcesConfig } from './resources';

const debug = Debug('cordova-res:platform');

export const enum Platform {
  ANDROID = 'android',
  IOS = 'ios',
  WINDOWS = 'windows',
}

export const PLATFORMS: readonly Platform[] = [Platform.ANDROID, Platform.IOS, Platform.WINDOWS];

export interface GeneratedResource extends ResourceKeyValues {
  type: ResourceType;
  platform: Platform;
  nodeName: string;
  nodeAttributes: readonly ResourceNodeAttribute[];
  indexAttribute: ResourceNodeAttribute;
}

export interface SimpleResourceOptions {
  /**
   * Paths to source images to use for this resource.
   */
  sources: (string | ImageSource)[];
}

export interface SimpleResourceResult {
  resources: GeneratedResource[];
  source: ResolvedSource;
}

export interface AdaptiveIconResourceOptions {

  /**
   * Provides options for an optional fallback for Android devices that do not support adaptive icons.
   *
   * @see https://cordova.apache.org/docs/en/dev/config_ref/images.html#adaptive-icons
   */
  icon?: SimpleResourceOptions;

  /**
   * Options for the foreground portion of adaptive icons.
   */
  foreground: SimpleResourceOptions;

  /**
   * Options for the background portion of adaptive icons.
   */
  background: {

    /**
     * Paths to source images or colors to use for this resource.
     */
    sources: (string | ImageSource | ColorSource)[];
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
 * Attempt to generate icons or splash screens for any platform.
 *
 * If there are no options given for this resource or if the source images are
 * not suitable, this function resolves with `undefined`.
 */
export async function safelyGenerateSimpleResources(type: ResourceType.ICON | ResourceType.SPLASH, platform: Platform, resourcesDirectory: string, options?: Readonly<SimpleResourceOptions>, errstream?: NodeJS.WritableStream): Promise<SimpleResourceResult | undefined> {
  if (!options) {
    return;
  }

  try {
    return await generateSimpleResources(type, platform, resourcesDirectory, options, errstream);
  } catch (e) {
    debug('Error with %O resources for %O: %O', type, platform, e);

    if (!(e instanceof ResolveSourceImageError)) {
      throw e;
    }
  }
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

  const source = await resolveSourceImage(platform, type, options.sources.map(s => imageSourceToPath(s)), errstream);

  debug('Using %O for %s source image for %s', source.image.src, type, platform);

  const config = getResourcesConfig(platform, type);
  const resources = await Promise.all(config.resources.map(
    async (resource): Promise<GeneratedResource> => ({
      ...resource,
      ...await generateImageResource(type, platform, resourcesDirectory, config, source.image, resource, errstream),
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
  if (!options || platform !== Platform.ANDROID) {
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

  debug('Building %s resources', ResourceType.ADAPTIVE_ICON);

  const { resources: iconResources = [], source: iconSource } = (await safelyGenerateSimpleResources(ResourceType.ICON, Platform.ANDROID, resourcesDirectory, options.icon, errstream)) || { source: undefined };
  const { resources: foregroundResources, source: foregroundSource } = await generateAdaptiveIconResourcesPortion(resourcesDirectory, ResourceKey.FOREGROUND, options.foreground.sources, errstream);
  const resolvedBackgroundSource = await resolveSource(Platform.ANDROID, ResourceType.ADAPTIVE_ICON, ResourceKey.BACKGROUND, options.background.sources, errstream);
  const backgroundResources = resolvedBackgroundSource.type === SourceType.RASTER
    ? await generateAdaptiveIconResourcesPortionFromImageSource(resourcesDirectory, ResourceKey.BACKGROUND, resolvedBackgroundSource, errstream)
    : foregroundResources.map(resource => ({ ...resource, src: '@color/background' }));

  const resources = await consolidateAdaptiveIconResources(foregroundResources, backgroundResources);

  return {
    resources: [...iconResources, ...resources],
    sources: [...iconSource ? [iconSource] : [], foregroundSource, resolvedBackgroundSource],
  };
}

export async function consolidateAdaptiveIconResources(foregrounds: readonly GeneratedResource[], backgrounds: readonly GeneratedResource[]): Promise<GeneratedResource[]> {
  return foregrounds.map(foreground => {
    const background = backgrounds.find(r => r[r.indexAttribute.key] === foreground[foreground.indexAttribute.key]);

    if (!background) {
      throw new BadInputError(`Cannot consolidate adaptive icon resources: No background for foreground: ${foreground.src}`);
    }

    return {
      platform: foreground.platform,
      type: foreground.type,
      foreground: foreground.src,
      background: background.src,
      density: foreground.density,
      width: foreground.width,
      height: foreground.height,
      nodeName: foreground.nodeName,
      nodeAttributes: foreground.nodeAttributes,
      indexAttribute: foreground.indexAttribute,
    };
  });
}

/**
 * Generate the foreground of Adaptive Icons.
 */
export async function generateAdaptiveIconResourcesPortion(resourcesDirectory: string, type: ResourceKey.FOREGROUND | ResourceKey.BACKGROUND, sources: (string | ImageSource)[], errstream?: NodeJS.WritableStream): Promise<SimpleResourceResult> {
  const source = await resolveSourceImage(Platform.ANDROID, ResourceType.ADAPTIVE_ICON, sources.map(s => imageSourceToPath(s)), errstream);

  return {
    resources: await generateAdaptiveIconResourcesPortionFromImageSource(resourcesDirectory, type, source, errstream),
    source,
  };
}

export async function generateAdaptiveIconResourcesPortionFromImageSource(resourcesDirectory: string, type: ResourceKey.FOREGROUND | ResourceKey.BACKGROUND, source: ResolvedImageSource, errstream?: NodeJS.WritableStream): Promise<GeneratedResource[]> {
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
      errstream
    ),
  })));

  return resources;
}

export async function generateImageResource(type: ResourceType, platform: Platform, resourcesDirectory: string, config: ResourcesTypeConfig<unknown>, image: ImageSourceData, schema: ImageSchema, errstream?: NodeJS.WritableStream): Promise<GeneratedResource> {
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
    src: dest,
    platform,
    nodeName: config.nodeName,
    nodeAttributes: config.nodeAttributes,
    indexAttribute: config.indexAttribute,
  };
}

export function imageSourceToPath(source: string | ImageSource): string {
  return typeof source === 'string' ? source : source.src;
}

export async function resolveSource(platform: Platform, type: ResourceType, name: string, sources: readonly (string | ImageSource | ColorSource)[], errstream?: NodeJS.WritableStream): Promise<ResolvedSource> {
  for (const source of sources) {
    if (typeof source === 'string' || source.type === SourceType.RASTER) {
      const src = imageSourceToPath(source);

      try {
        return await readSourceImage(platform, type, src);
      } catch (e) {
        debugSourceImage(src, e, errstream);
      }
    } else if (source.type === SourceType.COLOR) {
      const color = source.color.toUpperCase();

      if (!color.match(COLOR_REGEX)) {
        throw new BadInputError(`Color ${color} does not match regex ${COLOR_REGEX}.`);
      }

      return { platform, resource: type, type: SourceType.COLOR, name, color };
    }
  }

  throw new BadInputError(`Missing source for "${type}" (sources: ${sources.join(', ')})`);
}

export function validatePlatforms(platforms: readonly string[]): Platform[] {
  const result: Platform[] = [];

  for (const platform of platforms) {
    if (!isSupportedPlatform(platform)) {
      throw new BadInputError(`Unsupported platform: ${platform}`);
    }

    result.push(platform);
  }

  return result;
}

export function filterSupportedPlatforms(platforms: readonly string[]): Platform[] {
  return platforms.filter(isSupportedPlatform);
}

export function isSupportedPlatform(platform: any): platform is Platform {
  return PLATFORMS.includes(platform);
}
