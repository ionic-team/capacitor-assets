import { ensureDir } from '@ionic/utils-fs';
import * as Debug from 'debug';
import * as pathlib from 'path';

import { generateImage, resolveSourceImage } from './image';
import { RESOURCES, ResourceType } from './resources';

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
  [ResourceType.ICON]: RunPlatformResourceTypeOptions;
  [ResourceType.SPLASH]: RunPlatformResourceTypeOptions;
}

export interface GeneratedImage {
  src: string;
  dest: string;
  width: number;
  height: number;
}

export async function run(platform: Platform, types: ReadonlyArray<ResourceType>, options: Readonly<RunPlatformOptions>): Promise<GeneratedImage[]> {
  debug('Running %s platform with options: %O', platform, options);

  const results = await Promise.all(types.map(async type => runType(platform, type, options)));
  return ([] as GeneratedImage[]).concat(...results);
}

export async function runType(platform: Platform, type: ResourceType, options: Readonly<RunPlatformOptions>): Promise<GeneratedImage[]> {
  debug('Building %s resources for %s platform', type, platform);

  const [ src, srcbuf ] = await resolveSourceImage(options[type].sources);

  debug('Using %O for %s source image for %s', src, type, platform);

  const config = RESOURCES[platform][type];
  const dir = pathlib.join('resources', platform, type);
  await ensureDir(dir);

  const images = await Promise.all(config.images.map(async image => {
    const dest = pathlib.join(dir, image.name);
    await generateImage(image, srcbuf, dest);

    return { src, dest, ...image };
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
