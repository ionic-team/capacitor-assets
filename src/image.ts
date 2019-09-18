import { readFile, writeFile } from '@ionic/utils-fs';
import Debug from 'debug';
import sharp, { Metadata, Sharp } from 'sharp';
import util from 'util';

import { ResolveSourceImageError, ValidationError } from './error';
import { Platform } from './platform';
import { Format, RASTER_RESOURCE_VALIDATORS, ResolvedImageSource, ResourceType, SourceType } from './resources';

const debug = Debug('cordova-res:image');

/**
 * Check an array of source files, returning the first viable image.
 */
export async function resolveSourceImage(platform: Platform, type: ResourceType, sources: string[], errstream?: NodeJS.WritableStream): Promise<ResolvedImageSource> {
  const errors: [string, NodeJS.ErrnoException][] = [];

  for (const source of sources) {
    try {
      return await readSourceImage(platform, type, source, errstream);
    } catch (e) {
      errors.push([source, e]);
    }
  }

  for (const [ source, error ] of errors) {
    debugSourceImage(source, error, errstream);
  }

  throw new ResolveSourceImageError(
    `Missing source image for "${type}" (sources: ${sources.join(', ')})`,
    errors.map(([, error]) => error).filter((e): e is ValidationError => e instanceof ValidationError)
  );
}

export async function readSourceImage(platform: Platform, type: ResourceType, src: string, errstream?: NodeJS.WritableStream): Promise<ResolvedImageSource> {
  const image = sharp(await readFile(src));
  const metadata = await RASTER_RESOURCE_VALIDATORS[type](src, image);

  debug('Source image for %s: %O', type, metadata);

  return {
    platform,
    resource: type,
    type: SourceType.RASTER,
    src,
    image: { src, pipeline: image, metadata },
  };
}

export function debugSourceImage(src: string, error: NodeJS.ErrnoException, errstream?: NodeJS.WritableStream): void {
  if (error.code === 'ENOENT') {
    debug('Source file missing: %s', src);
  } else {
    if (errstream) {
      const message = util.format('WARN: Error with source file %s: %s', src, error);
      errstream.write(`${message}\n`);
    } else {
      debug('Error with source file %s: %O', src, error);
    }
  }
}

export interface ImageSchema {
  src: string;
  format: Format;
  width: number;
  height: number;
}

export async function generateImage(image: ImageSchema, src: Sharp, metadata: Metadata, errstream?: NodeJS.WritableStream): Promise<void> {
  debug('Generating %o (%ox%o)', image.src, image.width, image.height);

  if (image.format === Format.NONE) {
    return;
  }

  if (errstream) {
    if (metadata.format !== image.format) {
      errstream.write(`WARN: Must perform conversion from ${metadata.format} to png.\n`);
    }
  }

  const pipeline = applyFormatConversion(image.format, transformImage(image, src));

  await writeFile(image.src, await pipeline.toBuffer());
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
