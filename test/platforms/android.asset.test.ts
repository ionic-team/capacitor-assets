import { copy, pathExists, readFile, rm } from '@ionic/utils-fs';
import tempy from 'tempy';
import sharp from 'sharp';
import { join } from 'path';

import { Context, loadContext } from '../../src/ctx';
import { AssetKind, Assets } from '../../src/definitions';
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

  it('Should generate android icons', async () => {
    const assets = await ctx.project.loadInputAssets();
    const exportedIcons = Object.values(AndroidAssets).filter(
      a => a.kind === AssetKind.Icon,
    );

    const strategy = new AndroidAssetGenerator();
    let generatedAssets =
      (await assets.icon?.generate(strategy, ctx.project)) ?? [];
    expect(generatedAssets.length).toBe(exportedIcons.length);

    await verifyExists(generatedAssets);
    await verifySizes(generatedAssets);
  });

  it('Should generate android splashes', async () => {
    const strategy = new AndroidAssetGenerator();
    let generatedAssets =
      (await assets.splash?.generate(strategy, ctx.project)) ?? [];

    expect(generatedAssets.length).toBe(1);
    expect(await pathExists(generatedAssets[0]?.meta.dest ?? '')).toBe(true);

    generatedAssets =
      (await assets.splashDark?.generate(strategy, ctx.project)) ?? [];

    expect(generatedAssets.length).toBe(1);
    expect(await pathExists(generatedAssets[0]?.meta.dest ?? '')).toBe(true);

    /*
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
    */
  });
});
