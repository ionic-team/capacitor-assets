import { Context } from '../ctx';
import * as c from '../colors';
import { error, log } from '../util/log';
import { IosAssetGenerator } from '../platforms/ios';
import { PwaAssetGenerator } from '../platforms/pwa';
import { AndroidAssetGenerator } from '../platforms/android';
import { AssetGenerator, AssetGeneratorOptions } from '../asset-generator';
import { OutputAsset } from '../output-asset';
import { Assets } from '../definitions';
import { Project } from '../project';
import { InputAsset } from '../input-asset';

export async function run(ctx: Context): Promise<OutputAsset[]> {
  try {
    const assets = await ctx.project.loadInputAssets();

    if (
      [assets.logo, assets.icon, assets.splash, assets.splashDark].every(
        a => !a,
      )
    ) {
      error(
        `No assets found in the asset path ${c.ancillary(
          ctx.project.assetDir,
        )}. See capacitor-assets documentation to learn how to use this tool.`,
      );
      return [];
    }

    let platforms = ['ios', 'android', 'pwa'];
    if (ctx.args.ios || ctx.args.android || ctx.args.pwa) {
      platforms = [];
    }

    if (ctx.args.ios) {
      platforms.push('ios');
    }
    if (ctx.args.android) {
      platforms.push('android');
    }
    if (ctx.args.pwa) {
      platforms.push('pwa');
    }

    if (!ctx.args.silent) {
      log(
        `Generating assets for ${platforms
          .map(p => c.strong(c.success(p)))
          .join(', ')}`,
      );
    }

    const generators = getGenerators(ctx, platforms);

    const generated = await generateAssets(assets, generators, ctx.project);

    if (!ctx.args.silent) {
      logGenerated(generated);
    }

    if (!ctx.args.silent && platforms.indexOf('pwa') >= 0) {
      PwaAssetGenerator.logInstructions(generated);
    }

    return generated;
  } catch (e) {
    error('Unable to generate assets', e as Error);
  }
  return [];
}

async function generateAssets(
  assets: Assets,
  generators: AssetGenerator[],
  project: Project,
) {
  const generated: OutputAsset[] = [];

  async function generateAndCollect(asset: InputAsset) {
    const g = await Promise.all(
      generators.map(g => {
        console.log('Generating', g);
        return asset.generate(g, project);
      }),
    );
    generated.push(...(g.flat().filter(f => !!f) as OutputAsset[]));
  }

  const assetTypes = Object.values(assets).filter(v => !!v);

  for (const asset of assetTypes) {
    await generateAndCollect(asset);
  }

  return generated;
}

function getGenerators(ctx: Context, platforms: string[]): AssetGenerator[] {
  return platforms.map(p => {
    if (p === 'ios') {
      return new IosAssetGenerator(ctx.args as AssetGeneratorOptions);
    }
    if (p === 'android') {
      return new AndroidAssetGenerator(ctx.args as AssetGeneratorOptions);
    }
    if (p === 'pwa') {
      return new PwaAssetGenerator(ctx.args as AssetGeneratorOptions);
    }
  }) as AssetGenerator[];
}

// Print out a nice report of the assets generated
// and totals per platform
function logGenerated(generated: OutputAsset[]) {
  const sorted = generated.slice().sort((a, b) => {
    return a.template.platform.localeCompare(b.template.platform);
  });

  for (const g of sorted) {
    Object.keys(g.destFilenames).forEach(name => {
      const filename = g.getDestFilename(name);
      const outputInfo = g.getOutputInfo(name);
      log(
        `${c.strong(c.success('CREATE'))} ${c.strong(
          c.extra(g.template.platform),
        )} ${filename ?? ''}${outputInfo ? ` (${size(outputInfo.size)})` : ''}`,
      );
    });
  }

  log('\n');

  // Aggregate total assets and size per platform
  const totals = sorted.reduce(
    (totals, g) => {
      if (!(g.template.platform in totals)) {
        totals[g.template.platform] = {
          count: 0,
          size: 0,
        };
      }

      const entry = totals[g.template.platform];

      const count = Object.values(g.destFilenames).reduce(v => v + 1, 0);
      const size = Object.values(g.outputInfoMap).reduce(
        (v, c) => v + c.size,
        0,
      );

      totals[g.template.platform] = {
        count: entry.count + count,
        size: entry.size + size,
      };

      return totals;
    },
    {} as {
      [platform: string]: {
        count: number;
        size: number;
      };
    },
  );

  log('Totals:');
  for (const platformName of Object.keys(totals).sort()) {
    const e = totals[platformName];
    log(
      `${c.strong(c.success(platformName))}: ${c.strong(
        c.extra(e.count),
      )} generated, ${c.strong(size(e.size))} total`,
    );
  }
}

function size(bytes: number) {
  var i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (
    Number((bytes / Math.pow(1024, i)).toFixed(2)) * 1 +
    ' ' +
    ['B', 'KB', 'MB', 'GB', 'TB'][i]
  );
}
