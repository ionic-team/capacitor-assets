import Debug from 'debug';
import path from 'path';

import { generateRunOptions, parseOptions } from './cli';
import { read as readConfig, run as runConfig, write as writeConfig } from './config';
import { GeneratedImage, PLATFORMS, Platform, RunPlatformOptions, run as runPlatform } from './platform';
import { DEFAULT_RESOURCES_DIRECTORY } from './resources';

const debug = Debug('cordova-res');

async function CordovaRes({
  directory = process.cwd(),
  resourcesDirectory = DEFAULT_RESOURCES_DIRECTORY,
  logstream = process.stdout,
  platforms = {
    [Platform.ANDROID]: generateRunOptions(Platform.ANDROID, resourcesDirectory, []),
    [Platform.IOS]: generateRunOptions(Platform.IOS, resourcesDirectory, []),
  },
}: CordovaRes.Options = {}): Promise<void> {
  const configPath = path.resolve(directory, 'config.xml');
  const resourcesPath = path.isAbsolute(resourcesDirectory) ? resourcesDirectory : path.resolve(directory, resourcesDirectory);

  debug('Paths: (config: %O) (resources: %O)', configPath, resourcesPath);

  const config = await readConfig(configPath);
  const images: GeneratedImage[] = [];

  for (const platform of PLATFORMS) {
    const platformOptions = platforms[platform];

    if (platformOptions) {
      const platformImages = await runPlatform(platform, resourcesPath, platformOptions);
      logstream.write(`Generated ${platformImages.length} images for ${platform}\n`);
      images.push(...platformImages);
    }
  }

  runConfig(configPath, images, config);
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
   */
  export interface Options {
    /**
     * Operating directory. Usually the root of the project.
     *
     * `cordova-res` operates in the root of a standard Cordova project setup.
     * The specified directory should contain `config.xml` and a resources
     * folder, configured via `resourcesDirectory`.
     */
    readonly directory?: string;

    /**
     * Directory name or absolute path to resources directory.
     *
     * The resources directory contains the source images and generated images
     * of a Cordova project's resources.
     */
    readonly resourcesDirectory?: string;

    /**
     * Specify an alternative output mechanism.
     *
     * A NullStream may be used to silence output entirely.
     */
    readonly logstream?: NodeJS.WritableStream;

    /**
     * Resource generation configuration by platform.
     *
     * Each key/value represents the options for a supported platform. If
     * provided, resources are generated in an explicit, opt-in manner.
     */
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
