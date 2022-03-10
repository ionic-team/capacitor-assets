import { Context } from '../ctx';
import * as c from '../colors';
import { error, fatal, log } from '../util/log';
import { IosAssetGenerator } from '../platforms/ios';
import { PwaAssetGenerator } from '../platforms/pwa';
import { AndroidAssetGenerator } from '../platforms/android';
import { AssetGenerator } from '../asset-generator';
import { GeneratedAsset } from '../generated-asset';

export async function generateCommand(ctx: Context) {
  console.log('Generating', ctx);

  const assets = await ctx.project.loadAssets();
  console.log('Loaded assets', assets);

  if ([assets.icon, assets.splash, assets.splashDark].every(a => !a)) {
    fatal(
      `No assets found in the asset path ${c.ancillary(
        ctx.project.assetDir,
      )}. See capacitor-assets documentation to learn how to use this tool.`,
    );
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

  log(
    `Generating assets for ${platforms
      .map(p => c.strong(c.success(p)))
      .join(', ')}`,
  );

  const generators = getGenerators(platforms);

  const generated: GeneratedAsset[] = [];

  if (assets.icon) {
    const iconGenerated = await Promise.all(
      generators.map(g => assets.icon?.generate(g, ctx.project)),
    );
    generated.push(
      ...(iconGenerated.flat().filter(f => !!f) as GeneratedAsset[]),
    );
  }
  if (assets.splash) {
    const splashGenerated = await Promise.all(
      generators.map(g => assets.splash?.generate(g, ctx.project)),
    );
    generated.push(
      ...(splashGenerated.flat().filter(f => !!f) as GeneratedAsset[]),
    );
  }
  if (assets.splashDark) {
    const splashDarkGenerated = await Promise.all(
      generators.map(g => assets.splashDark?.generate(g, ctx.project)),
    );
    generated.push(
      ...(splashDarkGenerated.flat().filter(f => !!f) as GeneratedAsset[]),
    );
  }

  console.log('Generated', generated.length);
  logGenerated(generated);
}

function getGenerators(platforms: string[]): AssetGenerator[] {
  return platforms.map(p => {
    if (p === 'ios') {
      return new IosAssetGenerator();
    }
    if (p === 'android') {
      return new AndroidAssetGenerator();
    }
    if (p === 'pwa') {
      return new PwaAssetGenerator();
    }
  }) as AssetGenerator[];
}

function logGenerated(generated: GeneratedAsset[]) {
  for (const g of generated) {
    log(
      `${c.strong(c.success('CREATE'))} ${c.strong(c.extra(g.meta.platform))} ${
        g.meta.dest ?? ''
      } (${size(g.outputInfo.size)})`,
    );
  }

  log('\n');

  // Aggregate total assets and size per platform
  const totals = generated.reduce(
    (totals, g) => {
      if (!(g.meta.platform in totals)) {
        totals[g.meta.platform] = {
          count: 0,
          size: 0,
        };
      }

      const entry = totals[g.meta.platform];

      totals[g.meta.platform] = {
        count: entry.count + 1,
        size: entry.size + g.outputInfo.size,
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
