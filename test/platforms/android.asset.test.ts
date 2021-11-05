import { copy, pathExists, rm } from '@ionic/utils-fs';
import tempy from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import { IosAssetGenerationStrategy } from '../../src/platforms/ios';
import { AssetKind, Format } from '../../src/definitions';
import * as IosAssets from '../../src/platforms/ios/assets';
import sharp from 'sharp';

describe('Android asset test', () => {
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

  it('Should generate android splashes', async () => {
    const assets = await ctx.project.loadAssets();
  });
});