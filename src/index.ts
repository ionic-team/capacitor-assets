import Debug from 'debug';
import path from 'path';

import { generateRunOptions, parseOptions } from './cli';
import { read as readConfig, run as runConfig, write as writeConfig } from './config';
import { GeneratedImage, PLATFORMS, Platform, RunPlatformOptions, run as runPlatform } from './platform';

const debug = Debug('cordova-res');

async function CordovaRes({
  logstream = process.stdout,
  platforms = {
    [Platform.ANDROID]: generateRunOptions(Platform.ANDROID, []),
    [Platform.IOS]: generateRunOptions(Platform.IOS, []),
  },
}: CordovaRes.Options = {}): Promise<void> {
  const configPath = 'config.xml';
  const config = await readConfig(configPath);
  const images: GeneratedImage[] = [];

  for (const platform of PLATFORMS) {
    const platformOptions = platforms[platform];

    if (platformOptions) {
      const platformImages = await runPlatform(platform, platformOptions);
      logstream.write(`Generated ${platformImages.length} images for ${platform}\n`);
      images.push(...platformImages);
    }
  }

  runConfig(images, config);
  await writeConfig(configPath, config);
  logstream.write(`Wrote to config.xml\n`);
}

namespace CordovaRes {
  export type PlatformOptions = { [P in Platform]?: Readonly<RunPlatformOptions>; };

  export const run = CordovaRes;

  /**
   * Options for `cordova-res`.
   *
   * Each key may be excluded to use a provided default.
   *
   * Use `logstream` to specify an alternative output mechanism. A NullStream
   * may be used to silence output entirely.
   *
   * Each key/value in `platforms` represents the options for a supported
   * platform. If `platforms` is provided, resources are generated in an
   * explicit, opt-in manner.
   */
  export interface Options {
    readonly logstream?: NodeJS.WritableStream;
    readonly platforms?: Readonly<PlatformOptions>;
  }

  export async function runCommandLine(args: ReadonlyArray<string>): Promise<void> {
    if (args.includes('--version')) {
      const pkg = await import(path.resolve(__dirname, '../package.json'));
      process.stdout.write(pkg.version + '\n');
      return;
    }

    if (args[0] === 'help' || args.includes('--help') || args.includes('-h')) {
      const help = await import('./help');
      return help.run();
    }

    try {
      const options = parseOptions(args);
      await run(options);
    } catch (e) {
      debug('Caught fatal error: %O', e);
      process.exitCode = 1;
      process.stderr.write(e.stack ? e.stack : e.toString());
    }
  }
}

export = CordovaRes;
