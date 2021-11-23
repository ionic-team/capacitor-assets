import { ensureDir } from '@ionic/utils-fs';
import Debug from 'debug';
import pathlib from 'path';
import type { Sharp } from 'sharp';

import type { Operations } from '.';
import { BadInputError, ResolveSourceImageError } from './error';
import type { ImageSchema } from './image';
import {
  debugSourceImage,
  generateImage,
  readSourceImage,
  resolveSourceImage,
} from './image';
import type {
  AndroidAdaptiveIconResourceConfig,
  ColorSource,
  Format,
  ImageSource,
  ImageSourceData,
  ResolvedImageSource,
  ResolvedSource,
  ResourceConfig,
  SimpleResourceConfig,
} from './resources';
import {
  ANDROID_ADAPTIVE_ICON_RESOURCES,
  COLOR_REGEX,
  ResourceKey,
  ResourceType,
  SourceType,
  getSimpleResources,
  getRasterResourceSchema,
} from './resources';

const debug = Debug('cordova-res:platform');

export const enum Platform {
  ANDROID = 'android',
  IOS = 'ios',
  WINDOWS = 'windows',
}

export const PLATFORMS: readonly Platform[] = [
  Platform.ANDROID,
  Platform.IOS,
  Platform.WINDOWS,
];

export interface AndroidAdaptiveIconResourcePart {
  readonly [ResourceKey.SRC]: string;
}

export type TransformFunction = (
  image: ImageSchema,
  pipeline: Sharp,
) => Promise<Sharp> | Sharp;

export interface ResourceOptions<S> {
  /**
   * Represents the sources to use for this resource.
   *
   * Usually, this is a file path or {@link ImageSource}. In the case of
   * Android Adaptive Icons, this may be a {@link ColorSource}.
   */
  readonly sources: readonly S[];
}

export type SimpleResourceOptions = ResourceOptions<string | ImageSource>;

export interface GenerateResourceResult<R> {
  readonly resources: readonly R[];
  readonly source: ResolvedSource;
}

export interface RunPlatformResult<R> {
  readonly resources: readonly R[];
  readonly sources: ResolvedSource[];
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
  background: ResourceOptions<string | ImageSource | ColorSource>;
}

export interface RunPlatformOptions {
  readonly [ResourceType.ADAPTIVE_ICON]?: AdaptiveIconResourceOptions;
  readonly [ResourceType.ICON]?: SimpleResourceOptions;
  readonly [ResourceType.SPLASH]?: SimpleResourceOptions;
}

export interface GeneratedImageResource {
  readonly format: Format;
  readonly width: number;
  readonly height: number;
  readonly src: string;
}

export type UnconsolidatedGeneratedAndroidAdaptiveIconResource =
  AndroidAdaptiveIconResourceConfig & GeneratedImageResource;

/**
 * Run resource generation for the given platform.
 */
export async function run(
  platform: Platform,
  resourcesDirectory: string,
  options: Readonly<RunPlatformOptions>,
  operations: Required<Operations>,
  errstream: NodeJS.WritableStream | null,
): Promise<RunPlatformResult<ResourceConfig>> {
  debug('Running %s platform with options: %O', platform, options);

  const resources: ResourceConfig[] = [];
  const sources: ResolvedSource[] = [];
  const adaptiveResult = await safelyGenerateAdaptiveIconResources(
    platform,
    resourcesDirectory,
    options[ResourceType.ADAPTIVE_ICON],
    operations,
    errstream,
  );

  if (adaptiveResult && adaptiveResult.resources.length > 0) {
    resources.push(...adaptiveResult.resources);
    sources.push(...adaptiveResult.sources);
  } else {
    const iconResult = await generateSimpleResources(
      ResourceType.ICON,
      platform,
      resourcesDirectory,
      options[ResourceType.ICON],
      operations,
      errstream,
    );

    if (iconResult) {
      resources.push(...iconResult.resources);
      sources.push(iconResult.source);
    }
  }

  const splashResult = await generateSimpleResources(
    ResourceType.SPLASH,
    platform,
    resourcesDirectory,
    options[ResourceType.SPLASH],
    operations,
    errstream,
  );

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
export async function safelyGenerateSimpleResources(
  type: ResourceType.ICON | ResourceType.SPLASH,
  platform: Platform,
  resourcesDirectory: string,
  options: Readonly<SimpleResourceOptions> | undefined,
  operations: Required<Operations>,
  errstream: NodeJS.WritableStream | null,
): Promise<GenerateResourceResult<SimpleResourceConfig> | undefined> {
  if (!options) {
    return;
  }

  try {
    return await generateSimpleResources(
      type,
      platform,
      resourcesDirectory,
      options,
      operations,
      errstream,
    );
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
export async function generateSimpleResources(
  type: ResourceType.ICON | ResourceType.SPLASH,
  platform: Platform,
  resourcesDirectory: string,
  options: Readonly<SimpleResourceOptions> | undefined,
  operations: Required<Operations>,
  errstream: NodeJS.WritableStream | null,
): Promise<GenerateResourceResult<SimpleResourceConfig> | undefined> {
  if (!options) {
    return;
  }

  debug('Building %s resources for %s platform', type, platform);

  const source = await resolveSourceImage(
    platform,
    type,
    options.sources.map(s => imageSourceToPath(s)),
    errstream,
  );

  debug(
    'Using %O for %s source image for %s',
    source.image.src,
    type,
    platform,
  );

  const result = getSimpleResources(platform, type);

  const resources = await Promise.all(
    result.map(
      async (resource): Promise<SimpleResourceConfig> => ({
        ...resource,
        ...(await generateImageResource(
          resourcesDirectory,
          source.image,
          { ...resource, fit: operations.fit, position: operations.position },
          getResourceTransformFunction(platform, type, operations),
          errstream,
        )),
      }),
    ),
  );

  return {
    resources,
    source,
  };
}

export function getResourceTransformFunction(
  platform: Platform,
  type: ResourceType,
  operations: Required<Operations>,
): TransformFunction {
  if (typeof operations.transform !== 'function') {
    throw new BadInputError(
      `Transform function must be a function or undefined, not "${operations.transform}".`,
    );
  }

  const transforms = [operations.transform];
  const schema = getRasterResourceSchema(platform, type);

  if (!schema.alpha) {
    transforms.push((image, pipeline) =>
      pipeline.flatten({ background: { r: 255, g: 255, b: 255 } }),
    );
  }

  return combineTransformFunctions(transforms);
}

export function combineTransformFunctions(
  transformations: readonly TransformFunction[],
): TransformFunction {
  return transformations.reduce(
    (acc, transformation) => async (image, pipeline) => {
      const result = await acc(image, pipeline);

      if (!result || typeof result !== 'object') {
        throw new BadInputError(
          `Invalid Sharp pipeline returned while performing transforms: ${result}`,
        );
      }

      return transformation(image, result);
    },
  );
}

/**
 * Attempt to generate Adaptive Icons for any platform.
 *
 * If there are no options given for this resource or if the platform or
 * source images are not suitable, this function resolves with `undefined`.
 */
export async function safelyGenerateAdaptiveIconResources(
  platform: Platform,
  resourcesDirectory: string,
  options: Readonly<AdaptiveIconResourceOptions> | undefined,
  operations: Required<Operations>,
  errstream: NodeJS.WritableStream | null,
): Promise<RunPlatformResult<ResourceConfig> | undefined> {
  if (!options || platform !== Platform.ANDROID) {
    return;
  }

  try {
    return await generateAdaptiveIconResources(
      resourcesDirectory,
      options,
      operations,
      errstream,
    );
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
export async function generateAdaptiveIconResources(
  resourcesDirectory: string,
  options: Readonly<AdaptiveIconResourceOptions>,
  operations: Required<Operations>,
  errstream: NodeJS.WritableStream | null,
): Promise<RunPlatformResult<ResourceConfig>> {
  if (
    options.foreground.sources.length === 0 ||
    options.background.sources.length === 0
  ) {
    throw new BadInputError(
      'Adaptive icons require sources for both foreground and background.',
    );
  }

  debug('Building %s resources', ResourceType.ADAPTIVE_ICON);

  const { resources: iconResources = [], source: iconSource } =
    (await safelyGenerateSimpleResources(
      ResourceType.ICON,
      Platform.ANDROID,
      resourcesDirectory,
      options.icon,
      operations,
      errstream,
    )) || { source: undefined };

  const { resources: foregroundResources, source: foregroundSource } =
    await generateAdaptiveIconResourcesPortion(
      resourcesDirectory,
      ResourceKey.FOREGROUND,
      options.foreground.sources,
      operations,
      errstream,
    );

  const resolvedBackgroundSource = await resolveSource(
    Platform.ANDROID,
    ResourceType.ADAPTIVE_ICON,
    ResourceKey.BACKGROUND,
    options.background.sources,
    errstream,
  );

  const backgroundResources =
    resolvedBackgroundSource.type === SourceType.RASTER
      ? await generateAdaptiveIconResourcesPortionFromImageSource(
          resourcesDirectory,
          ResourceKey.BACKGROUND,
          resolvedBackgroundSource,
          operations,
          errstream,
        )
      : foregroundResources.map(resource => ({
          ...resource,
          src: '@color/background',
        }));

  const resources = await consolidateAdaptiveIconResources(
    foregroundResources,
    backgroundResources,
  );

  return {
    resources: [...iconResources, ...resources],
    sources: [
      ...(iconSource ? [iconSource] : []),
      foregroundSource,
      resolvedBackgroundSource,
    ],
  };
}

export async function consolidateAdaptiveIconResources(
  foregrounds: readonly UnconsolidatedGeneratedAndroidAdaptiveIconResource[],
  backgrounds: readonly UnconsolidatedGeneratedAndroidAdaptiveIconResource[],
): Promise<AndroidAdaptiveIconResourceConfig[]> {
  return foregrounds.map(foreground => {
    const background = backgrounds.find(r => r.density === foreground.density);

    if (!background) {
      throw new BadInputError(
        `Cannot consolidate adaptive icon resources: No background for foreground: ${foreground.src}`,
      );
    }

    return {
      platform: Platform.ANDROID,
      type: ResourceType.ADAPTIVE_ICON,
      format: foreground.format,
      foreground: foreground.src,
      background: background.src,
      density: foreground.density,
      width: foreground.width,
      height: foreground.height,
    };
  });
}

/**
 * Generate the foreground of Adaptive Icons.
 */
export async function generateAdaptiveIconResourcesPortion(
  resourcesDirectory: string,
  type: ResourceKey.FOREGROUND | ResourceKey.BACKGROUND,
  sources: readonly (string | ImageSource)[],
  operations: Required<Operations>,
  errstream: NodeJS.WritableStream | null,
): Promise<
  GenerateResourceResult<UnconsolidatedGeneratedAndroidAdaptiveIconResource>
> {
  const source = await resolveSourceImage(
    Platform.ANDROID,
    ResourceType.ADAPTIVE_ICON,
    sources.map(s => imageSourceToPath(s)),
    errstream,
  );

  return {
    resources: await generateAdaptiveIconResourcesPortionFromImageSource(
      resourcesDirectory,
      type,
      source,
      operations,
      errstream,
    ),
    source,
  };
}

export async function generateAdaptiveIconResourcesPortionFromImageSource(
  resourcesDirectory: string,
  type: ResourceKey.FOREGROUND | ResourceKey.BACKGROUND,
  source: ResolvedImageSource,
  operations: Required<Operations>,
  errstream: NodeJS.WritableStream | null,
): Promise<UnconsolidatedGeneratedAndroidAdaptiveIconResource[]> {
  debug(
    'Using %O for %s source image for %s',
    source.image.src,
    ResourceType.ADAPTIVE_ICON,
    Platform.ANDROID,
  );

  const parts = await Promise.all(
    ANDROID_ADAPTIVE_ICON_RESOURCES.map(
      async (
        resource,
      ): Promise<UnconsolidatedGeneratedAndroidAdaptiveIconResource> => ({
        ...resource,
        ...(await generateImageResource(
          resourcesDirectory,
          source.image,
          {
            ...resource,
            src: resource[type],
            fit: operations.fit,
            position: operations.position,
          },
          getResourceTransformFunction(
            Platform.ANDROID,
            ResourceType.ADAPTIVE_ICON,
            operations,
          ),
          errstream,
        )),
      }),
    ),
  );

  return parts;
}

export function getResourceDestination(
  resourcesDirectory: string,
  platform: Platform,
  type: ResourceType,
  src: string,
): string {
  return pathlib.join(
    resourcesDirectory,
    platform,
    type === ResourceType.ADAPTIVE_ICON ? ResourceType.ICON : type,
    src,
  );
}

export async function generateImageResource(
  resourcesDirectory: string,
  image: ImageSourceData,
  schema: ResourceConfig & ImageSchema,
  transform: TransformFunction = (image, pipeline) => pipeline,
  errstream: NodeJS.WritableStream | null,
): Promise<GeneratedImageResource> {
  const { pipeline, metadata } = image;
  const { platform, type, src, format, width, height, fit, position } = schema;

  const dest = getResourceDestination(resourcesDirectory, platform, type, src);
  const generatedImage: ImageSchema = {
    src: dest,
    format,
    width,
    height,
    fit,
    position,
  };

  await ensureDir(pathlib.dirname(dest));

  const img = await transform(generatedImage, pipeline.clone());

  await generateImage(generatedImage, img, metadata, errstream);

  return {
    format,
    width,
    height,
    src: dest,
  };
}

export function imageSourceToPath(source: string | ImageSource): string {
  return typeof source === 'string' ? source : source.src;
}

export async function resolveSource(
  platform: Platform,
  type: ResourceType,
  name: string,
  sources: readonly (string | ImageSource | ColorSource)[],
  errstream: NodeJS.WritableStream | null,
): Promise<ResolvedSource> {
  for (const source of sources) {
    if (typeof source === 'string' || source.type === SourceType.RASTER) {
      const src = imageSourceToPath(source);

      try {
        return await readSourceImage(platform, type, src, errstream);
      } catch (e) {
        debugSourceImage(src, e, errstream);
      }
    } else if (source.type === SourceType.COLOR) {
      const color = source.color.toUpperCase();

      if (!color.match(COLOR_REGEX)) {
        throw new BadInputError(
          `Color ${color} does not match regex ${COLOR_REGEX}.`,
        );
      }

      return { platform, resource: type, type: SourceType.COLOR, name, color };
    }
  }

  throw new BadInputError(
    `Missing source for "${type}" (sources: ${sources.join(', ')})`,
  );
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

export function filterSupportedPlatforms(
  platforms: readonly string[],
): Platform[] {
  return platforms.filter(isSupportedPlatform);
}

export function isSupportedPlatform(platform: any): platform is Platform {
  return PLATFORMS.includes(platform);
}

export function prettyPlatform(platform: Platform): string {
  switch (platform) {
    case Platform.IOS:
      return 'iOS';
    case Platform.ANDROID:
      return 'Android';
    case Platform.WINDOWS:
      return 'Windows';
  }
}
