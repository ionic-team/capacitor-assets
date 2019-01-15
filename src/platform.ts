import { ensureDir, readFile } from '@ionic/utils-fs';
import * as Debug from 'debug';
import * as path from 'path';
import * as sharp from 'sharp';

import { PLATFORMS, Platform, RESOURCES, RESOURCE_TYPES, ResourceType } from './resources';

const debug = Debug('cordova-res:platform');

export interface RunPlatformResourceTypeOptions {
  sources: string[];
}

export interface RunPlatformOptions {
  [ResourceType.ICON]: RunPlatformResourceTypeOptions;
  [ResourceType.SPLASH]: RunPlatformResourceTypeOptions;
}

export async function runPlatform(platform: Platform, types: ReadonlyArray<ResourceType>, options: Readonly<RunPlatformOptions>): Promise<void> {
  debug('Running %s platform with options: %O', platform, options);
  let images = 0;

  await Promise.all(types.map(async type => {
    debug('Building %s resources for %s platform', type, platform);

    const config = RESOURCES[platform][type];
    const src = await resolveSourceImage(options[type].sources);
    const dir = path.join('resources', platform, type);
    await ensureDir(dir);

    await Promise.all(config.images.map(async image => {
      const p = path.join(dir, image.name);
      debug('Generating %o (%ox%o)', p, image.width, image.height);

      await sharp(src)
        .resize(image.width, image.height)
        .toFile(p);

      images++;
    }));
  }));

  process.stdout.write(`Generated ${images} images for ${platform}\n`);
}

export async function resolveSourceImage(sources: string[]): Promise<Buffer> {
  for (const source of sources) {
    try {
      return await readFile(source);
    } catch (e) {
      debug('Error with source file %s: %s', source, e);
    }
  }

  throw new Error(`Could not find suitable source image. Looked at: ${sources.join(', ')}`);
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

export function validateResourceTypes(types: ReadonlyArray<string>): ResourceType[] {
  const result: ResourceType[] = [];

  for (const type of types) {
    if (!isSupportedResourceType(type)) {
      throw new Error(`Unsupported resource type: ${type}`);
    }

    result.push(type);
  }

  return result;
}

export function isSupportedPlatform(platform: any): platform is Platform {
  return PLATFORMS.includes(platform);
}

export function isSupportedResourceType(type: any): type is ResourceType {
  return RESOURCE_TYPES.includes(type);
}
