import { readFile, writeFile } from '@ionic/utils-fs';
import Debug from 'debug';
import sharp, { Sharp } from 'sharp';

import { RESOURCE_VALIDATORS, ResourceType } from './resources';

const debug = Debug('cordova-res:image');

/**
 * Check an array of source files, returning the first viable image.
 *
 * @return Promise<[path to source image, buffer of source image]>
 */
export async function resolveSourceImage(type: ResourceType, sources: string[]): Promise<[string, Sharp]> {
  for (const source of sources) {
    try {
      const image = sharp(await readFile(source));
      await RESOURCE_VALIDATORS[type](image);

      return [source, image];
    } catch (e) {
      debug('Error with source file %s: %s', source, e);
    }
  }

  throw new Error(`Could not find suitable source image. Looked at: ${sources.join(', ')}`);
}

export interface ImageSchema {
  width: number;
  height: number;
}

export async function generateImage(image: ImageSchema, src: Sharp, dest: string): Promise<void> {
  debug('Generating %o (%ox%o)', dest, image.width, image.height);

  const pipeline = transformImage(image, src);
  await writeFile(dest, await pipeline.toBuffer());
}

export function transformImage(image: ImageSchema, src: Sharp): Sharp {
  return src.resize(image.width, image.height);
}
