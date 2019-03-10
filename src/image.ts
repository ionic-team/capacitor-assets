import { readFile, writeFile } from '@ionic/utils-fs';
import Debug from 'debug';
import sharp from 'sharp';

const debug = Debug('cordova-res:image');

/**
 * Check an array of source files, returning the first viable image.
 *
 * @return Promise<[path to source image, buffer of source image]>
 */
export async function resolveSourceImage(sources: string[]): Promise<[string, Buffer]> {
  for (const source of sources) {
    try {
      // TODO: use sharp to check file and report image errors

      return [source, await readFile(source)];
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

export async function generateImage(image: ImageSchema, src: Buffer, dest: string): Promise<void> {
  debug('Generating %o (%ox%o)', dest, image.width, image.height);

  const buffer = await transformImage(image, src);
  await writeFile(dest, buffer);
}

export async function transformImage(image: ImageSchema, src: Buffer): Promise<Buffer> {
  return sharp(src)
    .resize(image.width, image.height)
    .toBuffer();
}
