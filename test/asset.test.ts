import { copy, rmSync as rm } from '@ionic/utils-fs';
import tempy from 'tempy';

import { Context, loadContext } from '../src/ctx';
import { Format } from '../src/definitions';

describe('Asset test', () => {
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

  it('Should load assets from project', async () => {
    const assets = await ctx.project.loadInputAssets();

    expect(assets.icon).not.toBeNull();
    expect(assets.icon?.format()).toBe(Format.Png);
    expect(assets.icon?.width).toBe(1024);
    expect(assets.icon?.height).toBe(1024);
    expect(assets.splash).not.toBeNull();
    expect(assets.splash?.format()).toBe(Format.Png);
    expect(assets.splash?.width).toBe(2732);
    expect(assets.splash?.height).toBe(2732);
    expect(assets.splashDark).not.toBeNull();
    expect(assets.splashDark?.format()).toBe(Format.Png);
    expect(assets.splashDark?.width).toBe(2732);
    expect(assets.splashDark?.height).toBe(2732);

    expect(assets.iosIcon).not.toBeNull();
    expect(assets.iosIcon?.format()).toBe(Format.Png);
    expect(assets.iosIcon?.width).toBe(1024);
    expect(assets.iosIcon?.height).toBe(1024);
  });
});
