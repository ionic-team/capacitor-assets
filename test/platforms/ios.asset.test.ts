import { copy, pathExists, rm } from '@ionic/utils-fs';
import tempy from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import { IosAssetGenerationStrategy } from '../../src/platforms/ios';
import { AssetKind, Format } from '../../src/definitions';
import * as IosAssets from '../../src/platforms/ios/assets';
import sharp from 'sharp';

describe('iOS Asset Test', () => {
  let ctx: Context;
  const fixtureDir = tempy.directory();

  beforeAll(async () => {
    await copy('test/fixtures/app', fixtureDir);
  });

  beforeEach(async () => {
    ctx = await loadContext(fixtureDir);
  });

  afterAll(async () => {
    await rm(fixtureDir, { force: true, recursive: true });
  });

  it('Should generate ios splashes', async () => {
    const assets = await ctx.project.loadAssets();

    const strategy = new IosAssetGenerationStrategy();
    let generatedAssets = await assets.splash?.generate(strategy, ctx.project) ?? [];

    expect(generatedAssets.length).toBe(1);
    expect(await pathExists(generatedAssets[0]?.meta.dest ?? '')).toBe(true);

    generatedAssets = await assets.splashDark?.generate(strategy, ctx.project) ?? [];

    expect(generatedAssets.length).toBe(1);
    expect(await pathExists(generatedAssets[0]?.meta.dest ?? '')).toBe(true);
  });

  it('Should generate ios icons', async () => {
    const assets = await ctx.project.loadAssets();

    const exportedIcons = Object.values(IosAssets).filter(a => a.kind === AssetKind.Icon);

    const strategy = new IosAssetGenerationStrategy();
    let generatedAssets = await assets.icon?.generate(strategy, ctx.project) ?? [];
    expect(generatedAssets.length).toBe(exportedIcons.length);

    const existSet = await Promise.all(generatedAssets.map(asset => pathExists(asset.meta.dest!)));
    expect(existSet.every(e => !!e)).toBe(true);

    const sizedSet = await Promise.all(generatedAssets.map(async asset => {
      const pipe = sharp(asset.meta.dest);
      const metadata = await pipe.metadata();
      return metadata.width === asset.meta.width && metadata.height === asset.meta.height;
    }));
    expect(sizedSet.every(e => !!e)).toBe(true);
  });
});