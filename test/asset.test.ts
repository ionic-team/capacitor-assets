import { Context, loadContext } from '../src/ctx';

describe('Asset test', () => {
  let ctx: Context;
  beforeEach(async () => {
    ctx = await loadContext('test/fixtures/app');
  });

  it('Should load assets from project', async () => {
    const assets = await ctx.project.loadAssets();

    expect(assets.icon).not.toBeNull();
    expect(assets.icon?.width).toBe(1024);
    expect(assets.icon?.height).toBe(1024);
    expect(assets.splash).not.toBeNull();
    expect(assets.splash?.width).toBe(2732);
    expect(assets.splash?.height).toBe(2732);
    expect(assets.splashDark).not.toBeNull();
    expect(assets.splashDark?.width).toBe(2732);
    expect(assets.splashDark?.height).toBe(2732);
  });
});