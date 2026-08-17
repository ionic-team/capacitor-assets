import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { copy, pathExists, readFile, rmSync as rm } from '@ionic/utils-fs';
import { temporaryDirectory } from 'tempy';
import sharp from 'sharp';
import { join } from 'path';

import { Context, loadContext } from '../../src/ctx';
import { AndroidOutputAssetTemplate, AndroidOutputAssetTemplateAdaptiveIcon, Assets } from '../../src/definitions';
import { OutputAsset } from '../../src/output-asset';
import { AndroidAssetGenerator } from '../../src/platforms/android';

describe('Android asset test', () => {
  let ctx: Context;
  const fixtureDir = temporaryDirectory();

  beforeAll(async () => {
    await copy('test/fixtures/app', fixtureDir);
  });

  beforeEach(async () => {
    ctx = await loadContext(fixtureDir);
  });

  afterAll(async () => {
    /*
    console.log(
      'Using text/fixtures/app Wrote to',
      join(fixtureDir, 'android', 'app', 'src', 'main', 'res'),
    );
    const files = await readdirp(
      join(fixtureDir, 'android', 'app', 'src', 'main', 'res'),
    );
    console.log(
      files
        .filter(f => !statSync(f).isDirectory())
        .map(f =>
          f.replace(
            join(fixtureDir, 'android', 'app', 'src', 'main', 'res'),
            '',
          ),
        ),
    );
    // console.log(await readFile(join(fixtureDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), { encoding: 'utf-8' }));
    */
    await rm(fixtureDir, { force: true, recursive: true });
  });

  async function verifySizes(generatedAssets: OutputAsset<AndroidOutputAssetTemplate>[]) {
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

  it('Should generate android legacy icons', async () => {
    const assets = await ctx.project.loadInputAssets();

    const strategy = new AndroidAssetGenerator();
    let generatedAssets = ((await assets.icon?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<AndroidOutputAssetTemplateAdaptiveIcon>[];

    // Expect legacy main icons and rounded to be generated (5 densities each, no ldpi)
    expect(generatedAssets.length).toBe(10);

    Object.values(generatedAssets[0].destFilenames).map(async (f) => expect(await pathExists(f)).toBe(true));

    await verifySizes(generatedAssets);
  });

  it('Should generate android adaptive icons', async () => {
    const assets = await ctx.project.loadInputAssets();

    const strategy = new AndroidAssetGenerator();
    let generatedAssets = ((await assets.iconForeground?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<AndroidOutputAssetTemplateAdaptiveIcon>[];

    expect(generatedAssets.length).toBe(5);

    Object.values(generatedAssets[0].destFilenames).map(async (f) => expect(await pathExists(f)).toBe(true));

    generatedAssets = ((await assets.iconBackground?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<AndroidOutputAssetTemplateAdaptiveIcon>[];

    expect(generatedAssets.length).toBe(5);

    Object.values(generatedAssets[0].destFilenames).map(async (f) => expect(await pathExists(f)).toBe(true));

    await verifySizes(generatedAssets);

    // The adaptive icon XML must have a full-bleed background and a
    // monochrome layer for Android 13+ themed icons
    const icLauncherXml = await readFile(
      join(ctx.project.config.android!.path!, 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26', 'ic_launcher.xml'),
      { encoding: 'utf-8' },
    );
    expect(icLauncherXml).toContain('<monochrome>');
    expect(icLauncherXml).toContain('<background android:drawable="@mipmap/ic_launcher_background" />');
  });

  it('Should generate android notification icons', async () => {
    const assets = await ctx.project.loadInputAssets();

    const strategy = new AndroidAssetGenerator();
    const generatedAssets = ((await assets.androidNotificationIcon?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<AndroidOutputAssetTemplate>[];

    // 5 densities plus the density-less drawable fallback
    expect(generatedAssets.length).toBe(6);
    await verifySizes(generatedAssets);
  });

  it('Should generate android splashes', async () => {
    const assets = await ctx.project.loadInputAssets();

    const strategy = new AndroidAssetGenerator();
    let generatedAssets = (await assets.splash?.generate(strategy, ctx.project)) ?? [];

    expect(generatedAssets.length).toBe(13);

    generatedAssets = (await assets.splashDark?.generate(strategy, ctx.project)) ?? [];

    expect(generatedAssets.length).toBe(13);
    await verifySizes(generatedAssets as OutputAsset<AndroidOutputAssetTemplate>[]);
  });
});

describe('Android Asset Test - Logo Only', () => {
  let ctx: Context;
  let assets: Assets;
  const fixtureDir = temporaryDirectory();

  beforeAll(async () => {
    await copy('test/fixtures/app-logo-only', fixtureDir);
  });

  beforeEach(async () => {
    ctx = await loadContext(fixtureDir);
    assets = await ctx.project.loadInputAssets();
  });

  async function verifySizes(generatedAssets: OutputAsset<AndroidOutputAssetTemplate>[]) {
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

  afterAll(async () => {
    /*
    console.log(
      'Wrote to',
      join(fixtureDir, 'android', 'app', 'src', 'main', 'res'),
    );
    const files = await readdirp(
      join(fixtureDir, 'android', 'app', 'src', 'main', 'res'),
    );
    console.log(
      files
        .filter(f => !statSync(f).isDirectory())
        .map(f =>
          f.replace(
            join(fixtureDir, 'android', 'app', 'src', 'main', 'res'),
            '',
          ),
        ),
    );
    */
    // console.log(await readFile(join(fixtureDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), { encoding: 'utf-8' }));
    await rm(fixtureDir, { force: true, recursive: true });
  });

  it('Should generate icons and splashes from logo', async () => {
    const strategy = new AndroidAssetGenerator({
      splashBackgroundColor: '#999999',
      splashBackgroundColorDark: '#122140',
    });
    let generatedAssets = ((await assets.logo?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<AndroidOutputAssetTemplate>[];

    expect(generatedAssets.length).toBe(46);
    await verifySizes(generatedAssets);
  });

  it('Should generate icons and splashes from logo-dark', async () => {
    const strategy = new AndroidAssetGenerator({
      splashBackgroundColor: '#999999',
      splashBackgroundColorDark: '#122140',
    });
    let generatedAssets = ((await assets.logoDark?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<AndroidOutputAssetTemplate>[];

    expect(generatedAssets.length).toBe(23);
    await verifySizes(generatedAssets);
  });

  it('Should generate icons in the given flavor folder', async () => {
    const strategy = new AndroidAssetGenerator({
      androidFlavor: 'demo',
    });
    let generatedAssets = ((await assets.logo?.generate(strategy, ctx.project)) ??
      []) as OutputAsset<AndroidOutputAssetTemplate>[];

    generatedAssets.forEach((asset) => {
      Object.keys(asset.destFilenames).forEach(async (name) => {
        let filename = asset.getDestFilename(name);

        expect(filename).toEqual(expect.stringContaining(join('app', 'src', 'demo', 'res')));
        expect(await pathExists(filename)).toBe(true);
      });
    });
  });
});
