import { readFile, writeFile } from '@ionic/utils-fs';
import Debug from 'debug';
import sharp, { Metadata, Sharp } from 'sharp';
import util from 'util';

import { ResolveSourceImageError, ValidationError } from './error';
import { Format, RESOURCE_VALIDATORS, ResourceType } from './resources';

const debug = Debug('cordova-res:image');

/**
 * Check an array of source files, returning the first viable image.
 *
 * @return Promise<[path to source image, buffer of source image]>
 */
export async function resolveSourceImage(type: ResourceType, sources: string[], errstream?: NodeJS.WritableStream): Promise<[string, Sharp, Metadata]> {
  const errors: [string, NodeJS.ErrnoException][] = [];

  for (const source of sources) {
    try {
      const image = sharp(await readFile(source));
      const metadata = await RESOURCE_VALIDATORS[type](source, image);

      debug('Source image for %s: %O', type, metadata);

      return [source, image, metadata];
    } catch (e) {
      errors.push([source, e]);
    }
  }

  if (errstream) {
    for (const [ source, error ] of errors) {
      if (error.code === 'ENOENT') {
        debug('Source file missing: %s', source);
      } else {
        const message = util.format('WARN: Error with source file %s: %s', source, error);
        errstream.write(`${message}\n`);
      }
    }
  }

  throw new ResolveSourceImageError(
    `Could not find suitable source image. Looked at: ${sources.join(', ')}`,
    errors.map(([, error]) => error).filter((e): e is ValidationError => e instanceof ValidationError)
  );
}

export interface ImageSchema {
  format: Format;
  width: number;
  height: number;
}

export async function generateImage(image: ImageSchema, src: Sharp, metadata: Metadata, dest: string, errstream?: NodeJS.WritableStream): Promise<void> {
  debug('Generating %o (%ox%o)', dest, image.width, image.height);

  if (errstream) {
    if (metadata.format !== image.format) {
      errstream.write(`WARN: Must perform conversion from ${metadata.format} to png.\n`);
    }
  }

  const pipeline = applyFormatConversion(image.format, transformImage(image, src));

  await writeFile(dest, await pipeline.toBuffer());
}

export function transformImage(image: ImageSchema, src: Sharp): Sharp {
  return src.resize(image.width, image.height);
}

export function applyFormatConversion(format: Format, src: Sharp): Sharp {
  switch (format) {
    case Format.PNG:
      return src.png();
    case Format.JPEG:
      return src.jpeg();
  }

  return src;
}
