import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { copy, rmSync as rm } from '@ionic/utils-fs';
import { temporaryDirectory } from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import { PwaAssetGenerator } from '../../src/platforms/pwa';

describe('PWA Manifest Test', () => {
  let ctx: Context;
  const fixtureDir = temporaryDirectory();

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
