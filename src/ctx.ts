import yargs from 'yargs';
import { join } from 'path';
import { hideBin } from 'yargs/helpers';
import { Project } from './project';

import { AssetGeneratorOptions } from './asset-generator';
import { MobileProjectConfig } from '@trapezedev/project';

export interface Context {
  // Path the to the root of the capacitor project, if needed
  projectRootPath?: string;
  args: AssetGeneratorOptions | any;
  project: Project;
  nodePackageRoot: string;
  rootDir: string;
}

export async function loadContext(projectRootPath?: string): Promise<Context> {
  const rootDir = process.cwd();

  const argv = yargs(hideBin(process.argv)).argv;

  let project: Project;
  try {
    project = await loadProject(projectRootPath, (argv.assetPath as string) ?? 'assets');
  } catch (e) {
    throw new Error(`Unable to load Capacitor project: ${(e as any).message}`);
  }

  return {
    args: argv,
    project,
    projectRootPath,
    // Important for resolving custom prettier plugin
    nodePackageRoot: join(__dirname, '../../'),
    rootDir,
  };
}

export function setArguments(ctx: Context, args: any) {
  ctx.args = args;
  process.env.VERBOSE = '' + !!args.verbose;
}

async function loadProject(projectRootPath?: string, projectAssetPath?: string): Promise<Project> {
  const config = await loadMobileProjectConfig(projectRootPath);
  console.log('Loading project', projectRootPath, projectAssetPath, config);
  const project = new Project(projectRootPath, config, projectAssetPath);
  await project.load();
  return project;
}

// TODO: Use the config loading stuff from @capacitor/configure
function loadMobileProjectConfig(projectRootPath?: string): MobileProjectConfig {
  return {
    ios: {
      path: 'ios/App',
    },
    android: {
      path: 'android',
    },
  };
}
