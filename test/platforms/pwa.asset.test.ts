import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { copy, pathExists, readJSON, rmSync as rm } from '@ionic/utils-fs';
import { temporaryDirectory } from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import { PwaAssetGenerator } from '../../src/platforms/pwa';
import { AssetKind, PwaOutputAssetTemplate } from '../../src/definitions';
import { ASSETS as PwaAssets, PWA_IOS_DEVICE_SIZES } from '../../src/platforms/pwa/assets';
import sharp from 'sharp';
import { isAbsolute, join, parse } from 'path';
import { OutputAsset } from '../../src/output-asset';

describe('PWA Asset Test', () => {
  let ctx: Context;
  const fixtureDir = temporaryDirectory();

  beforeAll(async () => {
    await copy('test/fixtures/app', fixtureDir);
  });

  beforeEach(async () => {
    ctx = await loadContext(fixtureDir);
  });

  afterAll(async () => {
    await rm(fixtureDir, { force: true, recursive: true });
  });

  async function verifySplashSizes(generatedAssets: OutputAsset<PwaOutputAssetTemplate>[]) {
    const sizedSet = await Promise.all(
      generatedAssets.map(async (asset) => {
        const dest = Object.values(asset.destFilenames)[0];
        const metadata = await sharp(dest).metadata();
        return metadata.width === asset.template.width && metadata.height === asset.template.height;
      }),
    );
    expect(sizedSet.every((e) => !!e)).toBe(true);
  }

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
    // 192, 512, 1024 (purpose any) + 512 maskable; apple-touch-icon is a
    // file only and must not be listed in the manifest
    expect(manifest.icons.length).toBe(4);

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
          return ext === '.png' && !isAbsolute(icon.src);
        })
        .every((i: any) => !!i),
    ).toBe(true);

    // Maskable icon must be a separate entry, not combined with "any"
    const purposes = manifest.icons.map((icon: any) => icon.purpose);
    expect(purposes).toContain('maskable');
    expect(purposes).not.toContain('any maskable');
    expect(manifest.icons.every((icon: any) => icon.type === 'image/png')).toBe(true);
  });

  // Previously skipped because splash sizes came from a live fetch of
  // Apple's HIG page; the static device list made this deterministic.
  it('Should generate PWA splashes', async () => {
    const assets = await ctx.project.loadInputAssets();

    const strategy = new PwaAssetGenerator();
    let generatedAssets = ((await assets.splash?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<PwaOutputAssetTemplate>[];

    expect(generatedAssets.length).toBe(PWA_IOS_DEVICE_SIZES.length);

    generatedAssets = ((await assets.splashDark?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<PwaOutputAssetTemplate>[];

    expect(generatedAssets.length).toBe(PWA_IOS_DEVICE_SIZES.length);
    await verifySplashSizes(generatedAssets);
  });
});

describe('PWA Asset Test - logo only', () => {
  let ctx: Context;
  const fixtureDir = temporaryDirectory();

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

    const strategy = new PwaAssetGenerator({
      splashBackgroundColor: '#dedbef',
    });

    const generated = await assets.logo!.generate(strategy, ctx.project);

    const manifestPath = join(fixtureDir, 'public', 'manifest.webmanifest');
    const manifest = await readJSON(manifestPath);
    expect(manifest['background_color']).toBe('#dedbef');

    // All icons plus a light and dark iOS splash per device size
    const iconCount = Object.values(PwaAssets).filter((a) => a.kind === AssetKind.Icon).length;
    expect(generated.length).toBe(iconCount + PWA_IOS_DEVICE_SIZES.length * 2);
    await verifySizes(generated as OutputAsset<PwaOutputAssetTemplate>[]);
  });
});
