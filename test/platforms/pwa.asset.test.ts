import { copy, pathExists, readJSON, rmSync as rm } from '@ionic/utils-fs';
import tempy from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import { PwaAssetGenerator } from '../../src/platforms/pwa';
import { AssetKind, PwaOutputAssetTemplate } from '../../src/definitions';
import { ASSETS as PwaAssets, PWA_IOS_DEVICE_SIZES } from '../../src/platforms/pwa/assets';
import sharp from 'sharp';
import { isAbsolute, join, parse } from 'path';
import { OutputAsset } from '../../src/output-asset';

describe('PWA Asset Test', () => {
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

  it('Should generate PWA icons', async () => {
    const assets = await ctx.project.loadInputAssets();

    const exportedIcons = Object.values(PwaAssets).filter((a) => a.kind === AssetKind.Icon);

    const strategy = new PwaAssetGenerator();
    let generatedAssets = ((await assets.icon?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<PwaOutputAssetTemplate>[];
    expect(generatedAssets.length).toBe(exportedIcons.length);

    const existSet = await Promise.all(
      generatedAssets.map((asset) => {
        const dest = asset.destFilenames[asset.template.name];
        return pathExists(dest);
      }),
    );
    expect(existSet.every((e) => !!e)).toBe(true);

    const sizedSet = await Promise.all(
      generatedAssets.map(async (asset) => {
        const dest = asset.destFilenames[asset.template.name];
        const pipe = sharp(dest);
        const metadata = await pipe.metadata();
        return metadata.width === asset.template.width && metadata.height === asset.template.height;
      }),
    );
    expect(sizedSet.every((e) => !!e)).toBe(true);

    const manifest = await strategy.getManifestJson(ctx.project);
    expect(manifest.icons.length).toBe(7);

    expect(
      manifest.icons
        .map((icon: any) => {
          const fname = parse(icon.src).name;
          const num = fname.split('-')[1];
          return icon.sizes === `${num}x${num}`;
        })
        .every((i: any) => !!i),
    ).toBe(true);

    // Make sure the file extensions are correct and the paths are relative
    expect(
      manifest.icons
        .map((icon: any) => {
          const ext = parse(icon.src).ext;
          return ext === '.webp' && !isAbsolute(icon.src);
        })
        .every((i: any) => !!i),
    ).toBe(true);
  });

  it.skip('Should generate PWA splashes', async () => {
    const assets = await ctx.project.loadInputAssets();

    const strategy = new PwaAssetGenerator();
    let generatedAssets = ((await assets.splash?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<PwaOutputAssetTemplate>[];

    expect(generatedAssets.length).toBeGreaterThan(10);

    generatedAssets = ((await assets.splashDark?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<PwaOutputAssetTemplate>[];
  });
});

describe('PWA Asset Test - logo only', () => {
  let ctx: Context;
  const fixtureDir = tempy.directory();

  async function verifySizes(generatedAssets: OutputAsset<PwaOutputAssetTemplate>[]) {
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

  beforeAll(async () => {
    await copy('test/fixtures/app-logo-only', fixtureDir);
  });

  beforeEach(async () => {
    ctx = await loadContext(fixtureDir);
  });

  afterAll(async () => {
    await rm(fixtureDir, { force: true, recursive: true });
  });

  it('Should update manifest with generated assets and colors from logo', async () => {
    const assets = await ctx.project.loadInputAssets();

    const exportedIcons = Object.values(PwaAssets).filter((a) => a.kind === AssetKind.Icon);

    const strategy = new PwaAssetGenerator({
      splashBackgroundColor: '#dedbef',
    });

    const generated = await assets.logo!.generate(strategy, ctx.project);

    const manifestPath = join(fixtureDir, 'public', 'manifest.webmanifest');
    const manifest = await readJSON(manifestPath);
    expect(manifest['background_color']).toBe('#dedbef');

    expect(generated.length).toBe(7);
    await verifySizes(generated as OutputAsset<PwaOutputAssetTemplate>[]);
  });
});
