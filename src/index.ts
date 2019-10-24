import { pathWritable } from '@ionic/utils-fs';
import Debug from 'debug';
import et from 'elementtree';
import path from 'path';

import { generateRunOptions, getDirectory, resolveOptions } from './cli';
import { getConfigPath, read as readConfig, run as runConfig, write as writeConfig } from './config';
import { BaseError } from './error';
import { GeneratedResource, PLATFORMS, Platform, RunPlatformOptions, run as runPlatform } from './platform';
import { DEFAULT_RESOURCES_DIRECTORY, Density, Orientation, ResolvedSource, SourceType } from './resources';
import { tryFn } from './utils/fn';

const debug = Debug('cordova-res');

interface Result {
  resources: ResultResource[];
  sources: ResultSource[];
}

interface ResultResource {
  src?: string;
  dest?: string;
  platform?: Platform;
  width?: number;
  height?: number;
  density?: Density;
  orientation?: Orientation;
  target?: string;
}

interface ResultSource {
  type: SourceType;
  value: string;
}

async function CordovaRes({
  directory = getDirectory(),
  resourcesDirectory = DEFAULT_RESOURCES_DIRECTORY,
  logstream = process.stdout,
  errstream = process.stderr,
  platforms = {
    [Platform.ANDROID]: generateRunOptions(Platform.ANDROID, resourcesDirectory, []),
    [Platform.IOS]: generateRunOptions(Platform.IOS, resourcesDirectory, []),
    [Platform.WINDOWS]: generateRunOptions(Platform.WINDOWS, resourcesDirectory, []),
  },
}: CordovaRes.Options = {}): Promise<Result> {
  const configPath = getConfigPath(directory);

  debug('Paths: (config: %O) (resources dir: %O)', configPath, resourcesDirectory);

  let config: et.ElementTree | undefined;
  const resources: GeneratedResource[] = [];
  const sources: ResolvedSource[] = [];

  if (await pathWritable(configPath)) {
    config = await readConfig(configPath);
  } else {
    debug('File missing/not writable: %O', configPath);

    if (errstream) {
      errstream.write(`WARN: No config.xml file in directory. Skipping config.\n`);
    }
  }

  for (const platform of PLATFORMS) {
    const platformOptions = platforms[platform];

    if (platformOptions) {
      const platformResult = await runPlatform(platform, resourcesDirectory, platformOptions, errstream);
      logstream.write(`Generated ${platformResult.resources.length} resources for ${platform}\n`);
      resources.push(...platformResult.resources);
      sources.push(...platformResult.sources);
    }
  }

  if (config) {
    await runConfig(configPath, resourcesDirectory, config, sources, resources, errstream);
    await writeConfig(configPath, config);

    logstream.write(`Wrote to config.xml\n`);
  }

  return {
    resources: resources.map(resource => {
      const { platform, type, src, foreground, background, width, height, density, orientation } = resource;

      return {
        platform,
        type,
        src,
        foreground,
        background,
        width,
        height,
        density,
        orientation,
      };
    }),
    sources: sources.map(source => {
      switch (source.type) {
        case SourceType.RASTER:
          return { platform: source.platform, resource: source.resource, type: SourceType.RASTER, value: source.src };
        case SourceType.COLOR:
          return { platform: source.platform, resource: source.resource, type: SourceType.COLOR, value: source.color, name: source.name };
      }
    }),
  };
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
     * Specify an alternative error output mechanism.
     *
     * A NullStream may be used to silence error output entirely.
     */
    readonly errstream?: NodeJS.WritableStream;

    /**
     * Resource generation configuration by platform.
     *
     * Each key/value represents the options for a supported platform. If
     * provided, resources are generated in an explicit, opt-in manner.
     */
    readonly platforms?: Readonly<PlatformOptions>;
  }

  export async function runCommandLine(args: readonly string[]): Promise<void> {
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
      const directory = getDirectory();
      const configPath = getConfigPath(directory);
      const config = await tryFn(() => readConfig(configPath));
      const options = await resolveOptions(args, directory, config);
      const result = await run(options);

      if (args.includes('--json')) {
        process.stdout.write(JSON.stringify(result, undefined, '\t'));
      }
    } catch (e) {
      debug('Caught fatal error: %O', e);
      process.exitCode = 1;

      if (args.includes('--json')) {
        process.stdout.write(JSON.stringify({ error: e instanceof BaseError ? e : e.toString() }, undefined, '\t'));
      } else {
        process.stderr.write(`${e instanceof BaseError ? `ERROR: ${e.toString()}` : (e.stack ? e.stack : String(e))}\n`);
      }
    }
  }
}

export = CordovaRes;
