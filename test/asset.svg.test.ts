import { copy, rmSync as rm, writeFile } from '@ionic/utils-fs';
import { join } from 'path';
import tempy from 'tempy';

import { Context, loadContext } from '../src/ctx';
import { Format } from '../src/definitions';

describe('Asset test - SVGs', () => {
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

  it('Should handle svgs', async () => {
    const svg = `
    <svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M30.4327 9.05578L30.5633 9.36054C31.5211 11.4721 32 13.6925 32 16C32 24.8163 24.8163 32 16 32C7.18367 32 0 24.8163 0 16C0 7.18367 7.18367 0 16 0C18.5905 0 21.0503 0.609524 23.3143 1.7415L23.619 1.89388L23.3578 2.11156C22.7048 2.63401 22.2041 3.28707 21.8776 4.04898L21.7905 4.26667L21.5946 4.17959C19.8313 3.35238 17.9592 2.91701 16 2.91701C8.77279 2.91701 2.91701 8.77279 2.91701 16C2.91701 23.2272 8.77279 29.083 16 29.083C23.2272 29.083 29.083 23.2054 29.083 16C29.083 14.2803 28.7565 12.5823 28.0816 10.9932L27.9946 10.7755L28.2122 10.6884C28.9741 10.4054 29.6707 9.92653 30.215 9.31701L30.4327 9.05578ZM26.4707 9.36057C28.3102 9.36057 29.8014 7.8694 29.8014 6.02996C29.8014 4.19051 28.3102 2.69934 26.4707 2.69934C24.6313 2.69934 23.1401 4.19051 23.1401 6.02996C23.1401 7.8694 24.6313 9.36057 26.4707 9.36057ZM15.9999 8.70754C11.9727 8.70754 8.7074 11.9728 8.7074 16.0001C8.7074 20.0273 11.9727 23.2926 15.9999 23.2926C20.0271 23.2926 23.2924 20.0273 23.2924 16.0001C23.2924 11.9728 20.0271 8.70754 15.9999 8.70754Z" fill="currentColor"></path>
</svg>
      `;

    await rm(join(fixtureDir, 'assets', 'icon-only.png'));
    await writeFile(join(fixtureDir, 'assets', 'icon-only.svg'), svg);

    const assets = await ctx.project.loadInputAssets();

    expect(assets.icon).not.toBeNull();
    expect(assets.icon?.format()).toBe(Format.Svg);
    expect(assets.icon?.width).toBe(1024);
    expect(assets.icon?.height).toBe(1024);
  });
});
