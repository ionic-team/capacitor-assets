import { Context, loadContext } from '../src/ctx';

describe('Asset test', () => {
  let ctx: Context;
  beforeEach(async () => {
    ctx = await loadContext('test/fixtures/app');
  });

  it('Should load assets from project', async () => {
    const assets = await ctx.project.loadAssets();

    expect(assets.icon).not.toBeNull();
    expect(assets.splash).not.toBeNull();
    expect(assets.splashDark).not.toBeNull();
  });
});