import { copy, pathExists, readFile, rmSync as rm } from '@ionic/utils-fs';
import tempy from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import { IosAssetGenerator, IOS_SPLASH_IMAGE_SET_PATH } from '../../src/platforms/ios';
import { AssetKind, Assets, Format, IosContents, IosOutputAssetTemplate } from '../../src/definitions';
import * as IosAssets from '../../src/platforms/ios/assets';
import sharp from 'sharp';
import { join } from 'path';
import { OutputAsset } from '../../src/output-asset';

describe('iOS Asset Test', () => {
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

  async function verifyExists(generatedAssets: OutputAsset<IosOutputAssetTemplate>[]) {
    const existSet = await Promise.all(
      generatedAssets.map((asset) => {
        const dest = asset.destFilenames[asset.template.name];
        return pathExists(dest);
      }),
    );
    expect(existSet.every((e) => !!e)).toBe(true);
  }

  async function verifySizes(generatedAssets: OutputAsset<IosOutputAssetTemplate>[]) {
    const sizedSet = await Promise.all(
      generatedAssets.map(async (asset) => {
        const dest = asset.destFilenames[asset.template.name];
        const pipe = sharp(dest);
        const metadata = await pipe.metadata();
        return metadata.width === asset.template.width && metadata.height === asset.template.height;
      }),
    );
    expect(sizedSet.every((e) => !!e)).toBe(true);
  }

  it('Should generate ios splashes', async () => {
    const strategy = new IosAssetGenerator();
    let generatedAssets = ((await assets.splash?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<IosOutputAssetTemplate>[];

    let dest = generatedAssets[0].getDestFilename(generatedAssets[0]?.template.name);
    expect(generatedAssets.length).toBe(3);
    expect(await pathExists(dest ?? '')).toBe(true);

    generatedAssets = ((await assets.splashDark?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<IosOutputAssetTemplate>[];

    dest = generatedAssets[0].getDestFilename(generatedAssets[0]?.template.name);
    expect(generatedAssets.length).toBe(3);
    expect(await pathExists(dest ?? '')).toBe(true);

    const contentsJson = JSON.parse(
      await readFile(join(ctx.project.config.ios!.path!, IOS_SPLASH_IMAGE_SET_PATH, 'Contents.json'), {
        encoding: 'utf-8',
      }),
    ) as IosContents;
    expect(contentsJson.images.find((i) => i.filename === IosAssets.IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK.name));
  });

  it('Should generate ios icons', async () => {
    const exportedIcons = Object.values(IosAssets).filter(
      (a) =>
        [AssetKind.Icon].indexOf(a.kind) >=
        0,
    );

    const strategy = new IosAssetGenerator();
    let generatedAssets = ((await assets.icon?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<IosOutputAssetTemplate>[];
    expect(generatedAssets.length).toBe(exportedIcons.length);

    await verifyExists(generatedAssets);
    await verifySizes(generatedAssets);
  });
});

describe('iOS Asset Test - Logo Only', () => {
  let ctx: Context;
  let assets: Assets;
  const fixtureDir = tempy.directory();

  beforeAll(async () => {
    await copy('test/fixtures/app-logo-only', fixtureDir);
  });

  beforeEach(async () => {
    ctx = await loadContext(fixtureDir);
    assets = await ctx.project.loadInputAssets();
  });

  afterAll(async () => {
    await rm(fixtureDir, { force: true, recursive: true });
  });

  async function verifySizes(generatedAssets: OutputAsset<IosOutputAssetTemplate>[]) {
    const sizedSet = await Promise.all(
      generatedAssets.map(async (asset) => {
        const dest = Object.values(asset.destFilenames)[0];
        const pipe = sharp(dest);
        const metadata = await pipe.metadata();
        return metadata.width === asset.template.width && metadata.height === asset.template.height;
      }),
    );
    expect(sizedSet.every((e) => !!e)).toBe(true);
  }

  it('Should generate icons and splashes from logo', async () => {
    const strategy = new IosAssetGenerator({
      splashBackgroundColor: '#999999',
      splashBackgroundColorDark: '#122140',
    });
    let generatedAssets = ((await assets.logo?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<IosOutputAssetTemplate>[];

    const assetTemplates = Object.values(IosAssets).filter(
      (a) =>
        [
          AssetKind.Icon,
          AssetKind.Splash,
          AssetKind.SplashDark,
        ].indexOf(a.kind) >= 0,
    );

    expect(generatedAssets.length).toBe(assetTemplates.length);

    const contentsJson = JSON.parse(
      await readFile(join(ctx.project.config.ios!.path!, IOS_SPLASH_IMAGE_SET_PATH, 'Contents.json'), {
        encoding: 'utf-8',
      }),
    ) as IosContents;
    expect(contentsJson.images.find((i) => i.filename === IosAssets.IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK.name));

    await verifySizes(generatedAssets);
  });

  it('Should generate icons and splashes from logo-dark', async () => {
    const strategy = new IosAssetGenerator({
      splashBackgroundColor: '#999999',
      splashBackgroundColorDark: '#122140',
    });
    let generatedAssets = ((await assets.logoDark?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<IosOutputAssetTemplate>[];

    const assetTemplates = Object.values(IosAssets).filter(
      (a) =>
        [
          AssetKind.Icon,
          AssetKind.Splash,
          AssetKind.SplashDark,
        ].indexOf(a.kind) >= 0,
    );

    // Shouldn't generate standard splash
    expect(generatedAssets.find((f) => f.asset.kind === AssetKind.Splash)).toBeUndefined();
    expect(generatedAssets.length).toBeGreaterThan(0);
    // Should be just the dark splashes
    expect(generatedAssets.length).toBe(3);

    const contentsJson = JSON.parse(
      await readFile(join(ctx.project.config.ios!.path!, IOS_SPLASH_IMAGE_SET_PATH, 'Contents.json'), {
        encoding: 'utf-8',
      }),
    ) as IosContents;
    expect(contentsJson.images.find((i) => i.filename === IosAssets.IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK.name));

    await verifySizes(generatedAssets);
  });
});
