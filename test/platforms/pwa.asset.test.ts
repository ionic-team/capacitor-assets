import { copy, pathExists, rm } from '@ionic/utils-fs';
import tempy from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import { PwaAssetGenerator } from '../../src/platforms/pwa';
import { AssetKind } from '../../src/definitions';
import * as PwaAssets from '../../src/platforms/pwa/assets';
import sharp from 'sharp';
import { parse } from 'path';

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

    const exportedIcons = Object.values(PwaAssets).filter(
      a => a.kind === AssetKind.Icon,
    );

    const strategy = new PwaAssetGenerator();
    let generatedAssets =
      (await assets.icon?.generate(strategy, ctx.project)) ?? [];
    expect(generatedAssets.length).toBe(exportedIcons.length);

    const existSet = await Promise.all(
      generatedAssets.map(asset => pathExists(asset.template.dest!)),
    );
    expect(existSet.every(e => !!e)).toBe(true);

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

    const manifest = await strategy.getManifestJson(ctx.project);
    expect(manifest.icons.length).toBe(6);

    expect(
      manifest.icons
        .map((icon: any) => {
          const fname = parse(icon.src).name;
          const num = fname.split('-')[1];
          return icon.sizes === `${num}x${num}`;
        })
        .every((i: any) => !!i),
    ).toBe(true);

    expect(
      manifest.icons
        .map((icon: any) => {
          const ext = parse(icon.src).ext;
          return ext === '.webp';
        })
        .every((i: any) => !!i),
    ).toBe(true);
  });
});
