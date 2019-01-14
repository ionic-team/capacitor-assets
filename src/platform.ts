import { ensureDir } from '@ionic/utils-fs';
import * as Debug from 'debug';
import * as path from 'path';
import * as sharp from 'sharp';

import { Platform, RESOURCES } from './resources';

const debug = Debug('cordova-res:platform');

export async function runPlatform(platform: Platform): Promise<void> {
  const plt = RESOURCES[platform];

  let images = 0;

  await Promise.all(Object.entries(plt).map(async ([ type, config]) => {
    debug('Building %s resources for %s platform', type, platform);

    const dir = path.join('resources', platform, type);
    await ensureDir(dir);

    await Promise.all(config.images.map(async image => {
      const p = path.join(dir, image.name);
      debug('Generating %o (%ox%o)', p, image.width, image.height);

      await sharp(`./resources/${type}.png`)
        .resize(image.width, image.height)
        .toFile(p);

      images++;
    }));
  }));

  process.stdout.write(`Generated ${images} images for ${platform}\n`);
}

export function isSupportedPlatform(platform?: string): platform is Platform {
  return platform === 'ios' || platform === 'android';
}
