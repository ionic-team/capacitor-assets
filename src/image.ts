import { readFile, writeFile } from '@ionic/utils-fs';
import Debug from 'debug';
import sharp, { Metadata, Sharp } from 'sharp';
import util from 'util';

import { ResolveSourceImageError, ValidationError } from './error';
import { Platform } from './platform';
import { Format, ResolvedImageSource, ResourceType, SourceType, validateResource } from './resources';

const debug = Debug('cordova-res:image');

export type SharpTransformation = (pipeline: Sharp) => Sharp;

/**
 * Check an array of source files, returning the first viable image.
 */
export async function resolveSourceImage(platform: Platform, type: ResourceType, sources: string[], errstream: NodeJS.WritableStream | null): Promise<ResolvedImageSource> {
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

export async function readSourceImage(platform: Platform, type: ResourceType, src: string, errstream: NodeJS.WritableStream | null): Promise<ResolvedImageSource> {
  const image = sharp(await readFile(src));
  const metadata = await validateResource(platform, type, src, image, errstream);

  debug('Source image for %s: %O', type, metadata);

  return {
    platform,
    resource: type,
    type: SourceType.RASTER,
    src,
    image: { src, pipeline: image, metadata },
  };
}

export function debugSourceImage(src: string, error: NodeJS.ErrnoException, errstream: NodeJS.WritableStream | null): void {
  if (error.code === 'ENOENT') {
    debug('Source file missing: %s', src);
  } else {
    errstream?.write(util.format('WARN:\tError with source file %s: %s', src, error) + '\n');
    debug('Error with source file %s: %O', src, error);
  }
}

export interface ImageSchema {
  src: string;
  format: Format;
  width: number;
  height: number;
}

export async function generateImage(image: ImageSchema, src: Sharp, metadata: Metadata, errstream: NodeJS.WritableStream | null): Promise<void> {
  if (image.format === Format.NONE) {
    debug('Skipping generation of %o (format=none)', image.src);
    return;
  }

  debug('Generating %o (%ox%o)', image.src, image.width, image.height);

  if (metadata.format !== image.format) {
    errstream?.write(util.format(`WARN:\tMust perform conversion from %s to png.`, metadata.format) + '\n');
  }

  const transformations = [createImageResizer(image), createImageConverter(image.format)];
  const pipeline = applyTransformations(src, transformations);

  await writeFile(image.src, await pipeline.toBuffer());
}

export function applyTransformations(src: Sharp, transformations: readonly SharpTransformation[]): Sharp {
  return transformations.reduce((pipeline, transformation) => transformation(pipeline), src);
}

export function createImageResizer(image: ImageSchema): SharpTransformation {
  return src => src.resize(image.width, image.height);
}

export function createImageConverter(format: Format): SharpTransformation {
  return src => {
    switch (format) {
      case Format.PNG:
        return src.png();
      case Format.JPEG:
        return src.jpeg();
    }

    return src;
  };
}
