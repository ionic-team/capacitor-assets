import { readFile, writeFile } from '@ionic/utils-fs';
import Debug from 'debug';
import sharp, { Sharp } from 'sharp';
import util from 'util';

import { ResolveSourceImageError, ValidationError } from './error';
import { RESOURCE_VALIDATORS, ResourceType } from './resources';

const debug = Debug('cordova-res:image');

/**
 * Check an array of source files, returning the first viable image.
 *
 * @return Promise<[path to source image, buffer of source image]>
 */
export async function resolveSourceImage(type: ResourceType, sources: string[], errstream?: NodeJS.WritableStream): Promise<[string, Sharp]> {
  const errors: [string, Error][] = [];

  for (const source of sources) {
    try {
      const image = sharp(await readFile(source));
      await RESOURCE_VALIDATORS[type](source, image);

      return [source, image];
    } catch (e) {
      errors.push([source, e]);
    }
  }

  if (errstream) {
    for (const [ source, error ] of errors) {
      const message = util.format('WARN: Error with source file %s: %s', source, error);
      errstream.write(`${message}\n`);
    }
  }

  throw new ResolveSourceImageError(
    `Could not find suitable source image. Looked at: ${sources.join(', ')}`,
    errors.map(([, error]) => error).filter((e): e is ValidationError => e instanceof ValidationError)
  );
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
