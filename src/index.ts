import { pathWritable } from '@ionic/utils-fs';
import Debug from 'debug';
import type et from 'elementtree';
import path from 'path';
import type { Sharp } from 'sharp';
import util from 'util';

import { getDirectory, parseOptions, resolveOptions } from './cli';
import {
  getConfigPath,
  read as readConfig,
  run as runConfig,
  write as writeConfig,
} from './cordova/config';
import { BaseError } from './error';
import type { ResizeOptions, ImageSchema } from './image';
import type { NativeProjectConfig } from './native';
import { copyToNativeProject } from './native';
import type {
  Platform,
  RunPlatformOptions,
  TransformFunction,
} from './platform';
import { PLATFORMS, prettyPlatform, run as runPlatform } from './platform';
import type {
  Density,
  Orientation,
  ResolvedSource,
  ResourceConfig,
} from './resources';
import { ResourceType, SourceType } from './resources';
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

async function CordovaRes(options: CordovaRes.Options = {}): Promise<Result> {
  const defaultOptions = parseOptions([]);
  const {
    directory,
    resourcesDirectory,
    logstream,
    errstream,
    platforms,
    projectConfig,
    skipConfig,
    copy,
    operations: {
      fit = 'cover',
      position = 'center',
      transform = (image: ImageSchema, pipeline: Sharp) => pipeline,
    },
  } = { ...defaultOptions, ...options };

  const configPath = getConfigPath(directory);

  debug(
    'Paths: (config: %O) (resources dir: %O)',
    configPath,
    resourcesDirectory,
  );

  let config: et.ElementTree | undefined;
  const resources: ResourceConfig[] = [];
  const sources: ResolvedSource[] = [];

  if (!skipConfig) {
    if (await pathWritable(configPath)) {
      config = await readConfig(configPath);
    } else {
      errstream?.write(
        `WARN:\tNo config.xml file in directory. Skipping config.\n`,
      );
      debug('File missing/not writable: %O', configPath);
    }
  }

  for (const platform of PLATFORMS) {
    const platformOptions = platforms[platform];
    const nativeProject = projectConfig[platform];

    if (platformOptions) {
      const platformResult = await runPlatform(
        platform,
        resourcesDirectory,
        platformOptions,
        { fit, position, transform },
        errstream,
      );

      logstream?.write(
        util.format(
          `Generated %s resources for %s`,
          platformResult.resources.length,
          prettyPlatform(platform),
        ) + '\n',
      );

      resources.push(...platformResult.resources);
      sources.push(...platformResult.sources);

      if (copy && nativeProject) {
        const shouldCopyIcons =
          resources.findIndex(
            res =>
              res.type === ResourceType.ICON ||
              res.type === ResourceType.ADAPTIVE_ICON,
          ) !== -1;
        const shouldCopySplash =
          resources.findIndex(res => res.type === ResourceType.SPLASH) !== -1;
        await copyToNativeProject(
          platform,
          resourcesDirectory,
          nativeProject,
          shouldCopyIcons,
          shouldCopySplash,
          logstream,
          errstream,
        );
      }
    }
  }

  if (config) {
    await runConfig(resourcesDirectory, config, sources, resources, errstream);
    await writeConfig(configPath, config);

    logstream?.write(`Wrote to config.xml\n`);
  }

  return {
    resources,
    sources: sources.map(source => {
      switch (source.type) {
        case SourceType.RASTER:
          return {
            platform: source.platform,
            resource: source.resource,
            type: SourceType.RASTER,
            value: source.src,
          };
        case SourceType.COLOR:
          return {
            platform: source.platform,
            resource: source.resource,
            type: SourceType.COLOR,
            value: source.color,
            name: source.name,
          };
      }
    }),
  };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace CordovaRes {
  export const run = CordovaRes;

  export type PlatformOptions = {
    [P in Platform]?: RunPlatformOptions;
  };

  export type NativeProjectConfigByPlatform = {
    [P in Platform]?: NativeProjectConfig;
  };

  export type Operations = ResizeOptions & {
    /**
     * Custom Sharp transform function.
     *
     * This function is called for every resource to allow for advanced image
     * manipulation via the Sharp API.
     *
     * @see https://sharp.pixelplumbing.com
     *
     * @param image The schema that describes the current image.
     * @param pipeline The Sharp object for the current image.
     *
     * @returns Sharp object
     */
    readonly transform?: TransformFunction;
  };

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
     * `null` may be specified to silence output.
     */
    readonly logstream?: NodeJS.WritableStream | null;

    /**
     * Specify an alternative error output mechanism.
     *
     * `null` may be specified to silence error output.
     */
    readonly errstream?: NodeJS.WritableStream | null;

    /**
     * Resource generation configuration by platform.
     *
     * Each key/value represents the options for a supported platform. If
     * provided, resources are generated in an explicit, opt-in manner.
     */
    readonly platforms?: Readonly<PlatformOptions>;

    /**
     * Config for the native projects by platform.
     */
    readonly projectConfig?: Readonly<NativeProjectConfigByPlatform>;

    /**
     * Do not use the Cordova config.xml file.
     */
    readonly skipConfig?: boolean;

    /**
     * Copy generated resources to native project directories.
     */
    readonly copy?: boolean;

    /**
     * Image manipulation operations.
     */
    readonly operations?: Operations;
  }

  export async function runCommandLine(args: readonly string[]): Promise<void> {
    if (args.includes('--version') || args.includes('-v')) {
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
      const options = await resolveOptions(args, config);
      const result = await run(options);

      if (args.includes('--json')) {
        process.stdout.write(JSON.stringify(result, undefined, '\t'));
      }
    } catch (e) {
      debug('Caught fatal error: %O', e);
      process.exitCode = 1;

      if (args.includes('--json')) {
        process.stdout.write(
          JSON.stringify(
            { error: e instanceof BaseError ? e : e.toString() },
            undefined,
            '\t',
          ),
        );
      } else {
        process.stderr.write(
          `${
            e instanceof BaseError
              ? `ERROR:\t${e.toString()}`
              : e.stack
              ? e.stack
              : String(e)
          }\n`,
        );
      }
    }
  }
}

export = CordovaRes;
