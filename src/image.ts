import { reduce } from '@ionic/utils-array';
import { readFile, writeFile } from '@ionic/utils-fs';
import Debug from 'debug';
import type { Metadata, Sharp } from 'sharp';
import sharp from 'sharp';
import util from 'util';

import {
  BadInputError,
  ResolveSourceImageError,
  ValidationError,
} from './error';
import type { Platform } from './platform';
import { prettyPlatform } from './platform';
import type { ResolvedImageSource, ResourceType } from './resources';
import {
  Format,
  SourceType,
  validateResource,
  prettyResourceType,
} from './resources';

const debug = Debug('cordova-res:image');

export type SharpTransformation = (pipeline: Sharp) => Promise<Sharp> | Sharp;

/**
 * Check an array of source files, returning the first viable image.
 */
export async function resolveSourceImage(
  platform: Platform,
  type: ResourceType,
  sources: string[],
  errstream: NodeJS.WritableStream | null,
): Promise<ResolvedImageSource> {
  const errors: [string, NodeJS.ErrnoException][] = [];

  for (const source of sources) {
    try {
      return await readSourceImage(platform, type, source, errstream);
    } catch (e) {
      errors.push([source, e]);
    }
  }

  for (const [source, error] of errors) {
    debugSourceImage(source, error, errstream);
  }

  const msg = util.format(
    `Missing valid source image for %s %s (sources: %s)`,
    prettyPlatform(platform),
    prettyResourceType(type, { pluralize: true }),
    sources.join(', '),
  );

  throw new ResolveSourceImageError(
    msg,
    errors
      .map(([, error]) => error)
      .filter((e): e is ValidationError => e instanceof ValidationError),
  );
}

export async function readSourceImage(
  platform: Platform,
  type: ResourceType,
  src: string,
  errstream: NodeJS.WritableStream | null,
): Promise<ResolvedImageSource> {
  const image = sharp(await readFile(src));
  const metadata = await validateResource(
    platform,
    type,
    src,
    image,
    errstream,
  );

  debug('Source image for %s: %O', type, metadata);

  return {
    platform,
    resource: type,
    type: SourceType.RASTER,
    src,
    image: { src, pipeline: image, metadata },
  };
}

export function debugSourceImage(
  src: string,
  error: NodeJS.ErrnoException,
  errstream: NodeJS.WritableStream | null,
): void {
  if (error.code === 'ENOENT') {
    debug('Source file missing: %s', src);
  } else {
    errstream?.write(
      util.format('WARN:\tError with source file %s: %s', src, error) + '\n',
    );
    debug('Error with source file %s: %O', src, error);
  }
}

export type Fit = 'contain' | 'cover' | 'fill';
export type Position =
  | 'center'
  | 'top'
  | 'right top'
  | 'right'
  | 'right bottom'
  | 'bottom'
  | 'left bottom'
  | 'left'
  | 'left top';

export const FITS: readonly Fit[] = ['contain', 'cover', 'fill'];

export const FITS_WITH_POSITION: readonly Fit[] = ['contain', 'cover'];

export const POSITIONS: readonly Position[] = [
  'center',
  'top',
  'right top',
  'right',
  'right bottom',
  'bottom',
  'left bottom',
  'left',
  'left top',
];

export function validateFit(fit: any): Fit {
  if (!FITS.includes(fit)) {
    throw new BadInputError(
      `Invalid fit: "${fit}" (valid: ${FITS.map(f => `"${f}"`).join(', ')})`,
    );
  }

  return fit;
}

export function validatePosition(fit: Fit, position: any): Position {
  if (!FITS_WITH_POSITION.includes(fit) && position !== 'center') {
    throw new BadInputError(
      `Cannot use position for fit: "${fit}" (only ${FITS_WITH_POSITION.map(
        f => `"${f}"`,
      ).join(', ')})`,
    );
  }

  if (!POSITIONS.includes(position)) {
    throw new BadInputError(
      `Invalid position: "${position}" (valid: ${POSITIONS.map(
        p => `"${p}"`,
      ).join(', ')})`,
    );
  }

  return position;
}

export interface ResizeOptions {
  /**
   * When resizing, use this fit algorithm.
   */
  readonly fit?: Fit;

  /**
   * When resizing using a {@link fit} of `cover` or `contain`, use this to position the image.
   */
  readonly position?: Position;
}

export interface ImageSchema extends ResizeOptions {
  readonly src: string;
  readonly format: Format;
  readonly width: number;
  readonly height: number;
}

export async function generateImage(
  image: ImageSchema,
  src: Sharp,
  metadata: Metadata,
  errstream: NodeJS.WritableStream | null,
): Promise<void> {
  if (image.format === Format.NONE) {
    debug('Skipping generation of %o (format=none)', image.src);
    return;
  }

  debug(
    'Generating %o (%ox%o) fit=%o position=%o',
    image.src,
    image.width,
    image.height,
    image.fit,
    image.position,
  );

  if (metadata.format !== image.format) {
    errstream?.write(
      util.format(
        `WARN:\tMust perform conversion from %s to png.`,
        metadata.format,
      ) + '\n',
    );
  }

  const pipeline = await applyTransformations(src, [
    createImageResizer(image),
    createImageConverter(image.format),
  ]);

  await writeFile(image.src, await pipeline.toBuffer());
}

export async function applyTransformations(
  src: Sharp,
  transformations: readonly SharpTransformation[],
): Promise<Sharp> {
  return reduce(
    transformations,
    async (pipeline, transformation) => transformation(pipeline),
    src,
  );
}

export function createImageResizer(image: ImageSchema): SharpTransformation {
  return src =>
    src.resize(image.width, image.height, {
      fit: image.fit,
      position: image.position,
    });
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
