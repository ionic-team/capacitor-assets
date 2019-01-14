import { ensureDir } from '@ionic/utils-fs';
import * as Debug from 'debug';
import * as path from 'path';
import * as sharp from 'sharp';

import { Platform, RESOURCES } from './resources';

const debug = Debug('cordova-res');

export async function run(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--version')) {
    const pkg = await import(path.resolve(__dirname, '../package.json'));
    process.stdout.write(pkg.version + '\n');
    return;
  }

  const [ platform ] = args;

  try {
    if (isSupportedPlatform(platform)) {
      await runPlatform(platform);
    } else {
      if (platform === 'help' || args.includes('--help') || args.includes('-h')) {
        const help = await import('./help');
        return help.run();
      }

      for (const plt of Object.keys(RESOURCES)) {
        await runPlatform(plt as Platform); // TODO
      }
    }
  } catch (e) {
    debug('Caught fatal error: %O', e);
    process.exitCode = 1;
    process.stdout.write(e.stack ? e.stack : e.toString());
  }
}

export function isSupportedPlatform(platform?: string): platform is Platform {
  return platform === 'ios' || platform === 'android';
}

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
