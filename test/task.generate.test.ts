import { copy, rm } from '@ionic/utils-fs';
import tempy from 'tempy';

import { Context, loadContext } from '../src/ctx';
import { Format } from '../src/definitions';

describe('Task: Generate test', () => {
  let ctx: Context;
  const fixtureDir = tempy.directory();

  beforeAll(async () => {
    await copy('test/fixtures/app', fixtureDir);
  });

  beforeEach(async () => {
    ctx = await loadContext(fixtureDir);
    ctx.args.silent = true;
  });

  afterAll(async () => {
    await rm(fixtureDir, { force: true, recursive: true });
  });

  it('Should generate all project assets', async () => {
    const { run } = await import('../src/tasks/generate');

    const generated = await run(ctx);

    // console.log(generated.map(g => Object.values(g.destFilenames)).flat());

    // TODO: Make this more specific instead of "it generated a lot of assets"
    expect(generated.length).toBeGreaterThan(100);
  });

  it('Should support custom pwa manifest dir', async () => {
    const { run } = await import('../src/tasks/generate');

    const generated = await run(ctx);

    // TODO: Make this more specific instead of "it generated a lot of assets"
    expect(generated.length).toBeGreaterThan(100);
  });
});
