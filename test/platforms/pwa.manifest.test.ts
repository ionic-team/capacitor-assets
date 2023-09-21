import { copy, pathExists, rmSync as rm } from '@ionic/utils-fs';
import tempy from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import { PwaAssetGenerator } from '../../src/platforms/pwa';
import { AssetKind } from '../../src/definitions';
import * as PwaAssets from '../../src/platforms/pwa/assets';
import sharp from 'sharp';
import { parse } from 'path';

describe('PWA Manifest Test', () => {
  let ctx: Context;
  const fixtureDir = tempy.directory();

  beforeAll(async () => {
    await copy('test/fixtures/pwa-with-manifest', fixtureDir);
  });

  beforeEach(async () => {
    ctx = await loadContext(fixtureDir);
  });

  afterAll(async () => {
    await rm(fixtureDir, { force: true, recursive: true });
  });

  it('Should load PWA manifest', async () => {
    const strategy = new PwaAssetGenerator();
    const manifest = await strategy.getManifestJson(ctx.project);
    expect(manifest.name).toBe('TestApp');
  });
});
