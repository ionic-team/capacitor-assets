import { Command } from 'commander';
import { Context, loadContext, setArguments } from './ctx';
import { logger } from './util/log';
import { wrapAction } from './util/cli';

export async function run() {
  try {
    const ctx = await loadContext();
    runProgram(ctx);
  } catch (e) {
    process.exitCode = 1;
    logger.error((e as any).message ? (e as any).message : String(e));
    throw e;
  }
}

export function runProgram(ctx: Context) {
  // program.version(env.package.version);
  const program = new Command();

  program
    .command('generate')
    .description(`Run image generation`)
    .option('--verbose', 'Verbose output')
    .action(
      wrapAction(async (args = {}) => {
        setArguments(ctx, args);

        const { generateCommand } = await import('./tasks/generate');
        await generateCommand(ctx);
      }),
    );

  program
    .command('copy')
    .description(`Copy generated images to project`)
    .option('--verbose', 'Verbose output')
    .action(
      wrapAction(async (args = {}) => {
        setArguments(ctx, args);

        const { copyCommand } = await import('./tasks/copy');
        await copyCommand(ctx);
      }),
    );

  program.arguments('[command]').action(
    wrapAction((_: any) => {
      program.outputHelp();
    }),
  );

  program.parse(process.argv);
}
