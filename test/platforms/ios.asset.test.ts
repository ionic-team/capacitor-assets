import { copy, pathExists, readFile, rm } from '@ionic/utils-fs';
import tempy from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import {
  IosAssetGenerator,
  IOS_SPLASH_IMAGE_SET_PATH,
} from '../../src/platforms/ios';
import { AssetKind, Assets, Format, IosContents } from '../../src/definitions';
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
    assets = await ctx.project.loadAssets();
  });

  afterAll(async () => {
    await rm(fixtureDir, { force: true, recursive: true });
  });

  async function verifyExists(generatedAssets: OutputAsset[]) {
    const existSet = await Promise.all(
      generatedAssets.map(asset => pathExists(asset.meta.dest!)),
    );
    expect(existSet.every(e => !!e)).toBe(true);
  }

  async function verifySizes(generatedAssets: OutputAsset[]) {
    const sizedSet = await Promise.all(
      generatedAssets.map(async asset => {
        const pipe = sharp(asset.meta.dest);
        const metadata = await pipe.metadata();
        return (
          metadata.width === asset.meta.width &&
          metadata.height === asset.meta.height
        );
      }),
    );
    expect(sizedSet.every(e => !!e)).toBe(true);
  }

  it('Should generate ios splashes', async () => {
    const strategy = new IosAssetGenerator();
    let generatedAssets =
      (await assets.splash?.generate(strategy, ctx.project)) ?? [];

    expect(generatedAssets.length).toBe(1);
    expect(await pathExists(generatedAssets[0]?.meta.dest ?? '')).toBe(true);

    generatedAssets =
      (await assets.splashDark?.generate(strategy, ctx.project)) ?? [];

    expect(generatedAssets.length).toBe(1);
    expect(await pathExists(generatedAssets[0]?.meta.dest ?? '')).toBe(true);

    const contentsJson = JSON.parse(
      await readFile(
        join(
          ctx.project.config.ios!.path!,
          IOS_SPLASH_IMAGE_SET_PATH,
          'Contents.json',
        ),
        { encoding: 'utf-8' },
      ),
    ) as IosContents;
    expect(
      contentsJson.images.find(
        i => i.filename === IosAssets.IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK.name,
      ),
    );
  });

  it('Should generate ios icons', async () => {
    const exportedIcons = Object.values(IosAssets).filter(
      a => a.kind === AssetKind.Icon,
    );

    const strategy = new IosAssetGenerator();
    let generatedAssets =
      (await assets.icon?.generate(strategy, ctx.project)) ?? [];
    expect(generatedAssets.length).toBe(exportedIcons.length);

    await verifyExists(generatedAssets);
    await verifySizes(generatedAssets);
  });

  it('Should generate ios notification icons', async () => {
    const exportedIcons = Object.values(IosAssets).filter(
      a => a.kind === AssetKind.NotificationIcon,
    );

    const strategy = new IosAssetGenerator();
    let generatedAssets =
      (await assets.iosNotificationIcon?.generate(strategy, ctx.project)) ?? [];
    expect(generatedAssets.length).toBeGreaterThan(0);
    expect(generatedAssets.length).toBe(exportedIcons.length);

    await verifyExists(generatedAssets);
    await verifySizes(generatedAssets);
  });

  it('Should generate ios settings icons', async () => {
    const exportedIcons = Object.values(IosAssets).filter(
      a => a.kind === AssetKind.SettingsIcon,
    );

    const strategy = new IosAssetGenerator();
    let generatedAssets =
      (await assets.iosSettingsIcon?.generate(strategy, ctx.project)) ?? [];
    expect(generatedAssets.length).toBeGreaterThan(0);
    expect(generatedAssets.length).toBe(exportedIcons.length);

    await verifyExists(generatedAssets);
    await verifySizes(generatedAssets);
  });

  it('Should generate ios spotlight icons', async () => {
    const exportedIcons = Object.values(IosAssets).filter(
      a => a.kind === AssetKind.SpotlightIcon,
    );

    const strategy = new IosAssetGenerator();
    let generatedAssets =
      (await assets.iosSpotlightIcon?.generate(strategy, ctx.project)) ?? [];
    expect(generatedAssets.length).toBeGreaterThan(0);
    expect(generatedAssets.length).toBe(exportedIcons.length);

    await verifyExists(generatedAssets);
    await verifySizes(generatedAssets);
  });
});
