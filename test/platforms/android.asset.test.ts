import { copy, pathExists, readFile, rm } from '@ionic/utils-fs';
import tempy from 'tempy';
import sharp from 'sharp';
import { join } from 'path';

import { Context, loadContext } from '../../src/ctx';
import {
  AndroidOutputAssetTemplate,
  AssetKind,
  Assets,
} from '../../src/definitions';
import { OutputAsset } from '../../src/output-asset';
import { AndroidAssetGenerator } from '../../src/platforms/android';
import * as AndroidAssets from '../../src/platforms/android/assets';

describe('Android asset test', () => {
  let ctx: Context;
  let assets: Assets;
  const fixtureDir = tempy.directory();

  beforeAll(async () => {
    await copy('test/fixtures/app', fixtureDir);
  });

  beforeEach(async () => {
    ctx = await loadContext(fixtureDir);
    assets = await ctx.project.loadInputAssets();
  });

  afterAll(async () => {
    await rm(fixtureDir, { force: true, recursive: true });
  });

  /*
  async function verifySizes(generatedAssets: OutputAsset[]) {
    const sizedSet = await Promise.all(
      generatedAssets.map(async asset => {
        const pipe = sharp(asset.template.dest);
        const metadata = await pipe.metadata();
        return (
          metadata.width === asset.template.width &&
          metadata.height === asset.template.height
        );
      }),
    );
    expect(sizedSet.every(e => !!e)).toBe(true);
  }
  */

  it('Should generate android icons', async () => {
    const assets = await ctx.project.loadInputAssets();

    const strategy = new AndroidAssetGenerator();
    let generatedAssets = ((await assets.splash?.generate(
      strategy,
      ctx.project,
    )) ?? []) as OutputAsset<AndroidOutputAssetTemplate>[];

    expect(generatedAssets.length).toBe(1);

    const template = generatedAssets[0].template;

    const outputForeground =
      generatedAssets[0].destFilenames[template.nameForeground!];
    expect(await pathExists(outputForeground)).toBe(true);

    const outputBackground =
      generatedAssets[0].destFilenames[template.nameBackground!];
    expect(await pathExists(outputBackground)).toBe(true);

    // await verifyExists(generatedAssets);
    // await verifySizes(generatedAssets);
  });

  /*
  it('Should generate android splashes', async () => {
    const strategy = new AndroidAssetGenerator();
    let generatedAssets =
      (await assets.splash?.generate(strategy, ctx.project)) ?? [];

    expect(generatedAssets.length).toBe(1);

    const template = generatedAssets[0].template as AndroidOutputAssetTemplate;

    const outputForeground = generatedAssets[0].destFilenames[template.nameForeground];
    expect(await pathExists(outputForeground)).toBe(
      true,
    );

    const outputBackground = generatedAssets[0].destFilenames[template.nameBackground];
    expect(await pathExists(outputBackground)).toBe(
      true,
    );

    generatedAssets =
      (await assets.splashDark?.generate(strategy, ctx.project)) ?? [];

    expect(generatedAssets.length).toBe(1);
  });
  */
});
