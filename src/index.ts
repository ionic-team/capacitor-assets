import { Command, InvalidArgumentError } from 'commander';

import * as c from './colors';
import type { Context } from './ctx';
import { loadContext, setArguments } from './ctx';
import { wrapAction } from './util/cli';
import { logger, log } from './util/log';

export async function run(): Promise<void> {
  try {
    const ctx = await loadContext();
    runProgram(ctx);
  } catch (e) {
    process.exitCode = 1;
    logger.error((e as any).message ? (e as any).message : String(e));
    throw e;
  }
}

function parseIntOption(value: string) {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}

export function runProgram(ctx: Context): void {
  // program.version(env.package.version);
  const program = new Command();

  program
    .command('generate')
    .description(`Run image generation`)
    .option('--verbose', 'Verbose output')
    .option('--ios', 'Generate iOS assets')
    .option('--android', 'Generate Android assets')
    .option('--pwa', 'Generate PWA/Web assets')
    .option(
      '--logoSplashScale <scale>',
      'Scaling factor for logo when generating splash screens from a single logo file',
    )
    .option(
      '--logoSplashTargetWidth <width>',
      'A specific target width for logo to use when generating splash screens from a single logo file',
      parseIntOption,
    )
    .option('--iconBackgroundColor <color>', 'Background color used for icons when generating from a single logo file')
    .option(
      '--iconBackgroundColorDark <color>',
      'Background color used for icon in dark mode when generating from a single logo file',
    )
    .option(
      '--splashBackgroundColor <color>',
      'Background color used for splash screens when generating from a single logo file',
    )
    .option(
      '--splashBackgroundColorDark <color>',
      'Background color used for splash screens in dark mode when generating from a single logo file',
    )
    .option('--pwaManifestPath <path>', "Path to the web app's manifest.json or manifest.webmanifest file")
    .option(
      '--pwaNoAppleFetch',
      'Whether to fetch the latest screen sizes for Apple devices from the official Apple site. Set to true if running offline to use local cached sizes (may be occasionally out of date)',
    )
    .option(
      '--assetPath <path>',
      'Path to the assets directory for your project. By default will check "assets" and "resources" directories, in that order.',
    )
    .option(
      '--androidFlavor <name>',
      'Android product flavor name where generated assets will be created. Defaults to "main".',
    )
    .option('--iosProject <dir>', 'Path to iOS project (defaults to "ios/App")')
    .option('--androidProject <dir>', 'Path to Android project (defaults to "android")')
    /*
    .option(
      '--pwaTags',
      'Log tags necessary for including generated PWA assets in your index.html file',
    )
    */
    .action(
      wrapAction(async (args = {}) => {
        setArguments(ctx, args);

        const { run } = await import('./tasks/generate');
        await run(ctx);
      }),
    );

  program.arguments('[command]').action(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    wrapAction((_: any) => {
      log(c.strong('\n⚡️ Capacitor Assets ⚡️\n'));
      program.outputHelp();
    }),
  );

  program.parse(process.argv);
}
