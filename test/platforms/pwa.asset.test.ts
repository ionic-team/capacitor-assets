import { copy, pathExists, readJSON, rmSync as rm, writeFile } from '@ionic/utils-fs';
import tempy from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import { PwaAssetGenerator } from '../../src/platforms/pwa';
import { AssetKind, PwaOutputAssetTemplate } from '../../src/definitions';
import { ASSETS as PwaAssets, PWA_IOS_DEVICE_SIZES, ASSETS } from '../../src/platforms/pwa/assets';
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
  it('Should get splash sizes from Apple HIG', async () => {
    const strategy = new PwaAssetGenerator();
    const sizes = await strategy.getSplashSizes();
    expect(sizes.length).toBeGreaterThan(0);
  });

  it('Should generate PWA splashes', async () => {
    const assets = await ctx.project.loadInputAssets();

    const strategy = new PwaAssetGenerator();
    let generatedAssets = ((await assets.splash?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<PwaOutputAssetTemplate>[];

    expect(generatedAssets.length).toBeGreaterThan(10);

    generatedAssets = ((await assets.splashDark?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<PwaOutputAssetTemplate>[];
    expect(generatedAssets.length).toBeGreaterThan(10);
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
      pwaNoAppleFetch: true,
    });
    strategy.options.pwaNoAppleFetch = true;

    const generated = await assets.logo!.generate(strategy, ctx.project);

    const manifestPath = join(fixtureDir, 'public', 'manifest.webmanifest');
    const manifest = await readJSON(manifestPath);
    expect(manifest['background_color']).toBe('#dedbef');
    const iconsLength = Object.values(ASSETS).filter((a) => a.kind === AssetKind.Icon).length;
    // Light and Dark mode splashes, plus icons
    expect(generated.length).toBe(2*PWA_IOS_DEVICE_SIZES.length+iconsLength);
    await verifySizes(generated as OutputAsset<PwaOutputAssetTemplate>[]);
  });
});

describe('PWA Asset Test - pwaAppleSizesFile', () => {
  let ctx: Context;
  const fixtureDir = tempy.directory();
  const tempFileDir = tempy.directory();

  beforeAll(async () => {
    await copy('test/fixtures/app', fixtureDir);
  });

  beforeEach(async () => {
    ctx = await loadContext(fixtureDir);
  });

  afterAll(async () => {
    await rm(fixtureDir, { force: true, recursive: true });
    await rm(tempFileDir, { force: true, recursive: true });
  });

  it('Should read splash sizes from pwaAppleSizesFile', async () => {
    const appleSizesFile = join(tempFileDir, 'apple-sizes.txt');
    const fileContent = `
      iPhone 14 Pro Max: 1290x2796 @3x
      iPhone 14 Pro: 1179x2556 @3x
      iPhone 13 Pro Max: 1284x2778 @3x
      iPad Pro 12.9": 2048x2732 @2x
      iPad Air: 1640x2360 @2x
    `;

    await writeFile(appleSizesFile, fileContent);

    const strategy = new PwaAssetGenerator({
      pwaAppleSizesFile: appleSizesFile,
      pwaNoAppleFetch: true,
    });

    const sizes = await strategy.getSplashSizes();

    expect(sizes.length).toBe(5);
    expect(sizes).toContain('1290x2796@3x');
    expect(sizes).toContain('1179x2556@3x');
    expect(sizes).toContain('1284x2778@3x');
    expect(sizes).toContain('2048x2732@2x');
    expect(sizes).toContain('1640x2360@2x');

    // Verify format is correct (widthxheight@densityx)
    sizes.forEach((size) => {
      const parts = size.split('@');
      expect(parts.length).toBe(2);
      const [width, height] = parts[0].split('x');
      expect(parseInt(width)).toBeGreaterThan(0);
      expect(parseInt(height)).toBeGreaterThan(0);
      expect(parts[1]).toMatch(/^\d+x$/);
    });
  });

  it('Should deduplicate splash sizes from pwaAppleSizesFile', async () => {
    const appleSizesFile = join(tempFileDir, 'apple-sizes-dupes.txt');
    const fileContent = `
      iPhone 14 Pro Max: 1290x2796 @3x
      iPhone 14 Pro: 1179x2556 @3x
      iPhone 13 Pro Max: 1284x2778 @3x
      iPhone 14 Pro Max (duplicate): 1290x2796 @3x
      iPad Pro 12.9": 2048x2732 @2x
      iPad Air: 1640x2360 @2x
      iPad Pro 12.9" (duplicate): 2048x2732 @2x
    `;

    await writeFile(appleSizesFile, fileContent);

    const strategy = new PwaAssetGenerator({
      pwaAppleSizesFile: appleSizesFile,
      pwaNoAppleFetch: true,
    });

    const sizes = await strategy.getSplashSizes();

    // Should have 5 unique sizes, not 7
    expect(sizes.length).toBe(5);
    expect(sizes).toContain('1290x2796@3x');
    expect(sizes).toContain('1179x2556@3x');
    expect(sizes).toContain('1284x2778@3x');
    expect(sizes).toContain('2048x2732@2x');
    expect(sizes).toContain('1640x2360@2x');
  });

  it('Should handle file read errors gracefully', async () => {
    const nonExistentFile = join(tempFileDir, 'non-existent-file.txt');

    const strategy = new PwaAssetGenerator({
      pwaAppleSizesFile: nonExistentFile,
      pwaNoAppleFetch: true,
    });

    // Should fall back to default sizes when file doesn't exist
    const sizes = await strategy.getSplashSizes();

    // Should return default PWA_IOS_DEVICE_SIZES
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes).toEqual(PWA_IOS_DEVICE_SIZES);
  });

  it('Should use pwaAppleSizesFile when generating splashes', async () => {
    const appleSizesFile = join(tempFileDir, 'apple-sizes-custom.txt');
    const fileContent = `
      Custom Device 1: 1000x2000 @2x
      Custom Device 2: 1500x3000 @3x
    `;

    await writeFile(appleSizesFile, fileContent);

    const assets = await ctx.project.loadInputAssets();

    const strategy = new PwaAssetGenerator({
      pwaAppleSizesFile: appleSizesFile,
      pwaNoAppleFetch: true,
    });

    const generatedAssets = ((await assets.splash?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<PwaOutputAssetTemplate>[];

    // Should generate splashes for the 2 custom sizes
    expect(generatedAssets.length).toBe(2);
    
    // Verify the generated assets match the custom sizes
    const sizes = generatedAssets.map((asset) => {
      const parts = asset.template.name.match(/apple-splash-(\d+)-(\d+)@(\d+x)/);
      if (parts) {
        return `${parts[1]}x${parts[2]}@${parts[3]}`;
      }
      return null;
    }).filter(Boolean);

    expect(sizes).toContain('1000x2000@2x');
    expect(sizes).toContain('1500x3000@3x');
  });
});

