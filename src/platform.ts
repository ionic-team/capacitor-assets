import { ensureDir } from '@ionic/utils-fs';
import Debug from 'debug';
import pathlib from 'path';

import { generateImage, resolveSourceImage } from './image';
import { RESOURCES, RESOURCE_TYPES, ResourceKey, ResourceType, ResourcesImageConfig } from './resources';

const debug = Debug('cordova-res:platform');

export const enum Platform {
  ANDROID = 'android',
  IOS = 'ios',
}

export const PLATFORMS: ReadonlyArray<Platform> = [Platform.ANDROID, Platform.IOS];

export interface RunPlatformResourceTypeOptions {
  sources: string[];
}

export interface RunPlatformOptions {
  [ResourceType.ICON]?: RunPlatformResourceTypeOptions;
  [ResourceType.SPLASH]?: RunPlatformResourceTypeOptions;
}

export interface GeneratedImage extends ResourcesImageConfig {
  src: string;
  dest: string;
  platform: Platform;
  nodeName: string;
  nodeAttributes: ResourceKey[];
}

export async function run(platform: Platform, resourcesPath: string, options: Readonly<RunPlatformOptions>, errstream?: NodeJS.WritableStream): Promise<GeneratedImage[]> {
  debug('Running %s platform with options: %O', platform, options);

  const results: GeneratedImage[] = [];

  return results.concat(...await Promise.all(RESOURCE_TYPES.map(async type => {
    const typeOptions = options[type];

    if (typeOptions) {
      return runType(platform, type, resourcesPath, typeOptions, errstream);
    }

    return [];
  })));
}

export async function runType(platform: Platform, type: ResourceType, resourcesPath: string, options: Readonly<RunPlatformResourceTypeOptions>, errstream?: NodeJS.WritableStream): Promise<GeneratedImage[]> {
  debug('Building %s resources for %s platform', type, platform);

  const [ src, pipeline, metadata ] = await resolveSourceImage(type, options.sources, errstream);

  debug('Using %O for %s source image for %s', src, type, platform);

  const config = RESOURCES[platform][type];
  const dir = pathlib.resolve(resourcesPath, platform, type);
  await ensureDir(dir);

  const images = await Promise.all(config.images.map(async image => {
    const dest = pathlib.join(dir, image.name);
    await generateImage(image, pipeline.clone(), metadata, dest, errstream);

    return {
      src,
      dest,
      platform,
      ...image,
      nodeName: config.nodeName,
      nodeAttributes: config.nodeAttributes,
    };
  }));

  return images;
}

export function validatePlatforms(platforms: ReadonlyArray<string>): Platform[] {
  const result: Platform[] = [];

  for (const platform of platforms) {
    if (!isSupportedPlatform(platform)) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    result.push(platform);
  }

  return result;
}

export function isSupportedPlatform(platform: any): platform is Platform {
  return PLATFORMS.includes(platform);
}
