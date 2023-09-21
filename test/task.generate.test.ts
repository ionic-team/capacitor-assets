import { copy, readJSON, rmSync as rm } from '@ionic/utils-fs';
import { join } from 'path';
import tempy from 'tempy';

import { Context, loadContext } from '../src/ctx';
import { Format } from '../src/definitions';
import { OutputAsset } from '../src/output-asset';

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

  function log(target: string, generated: OutputAsset[]) {
    console.log('-'.repeat(10), target.toUpperCase(), '-'.repeat(10));
    console.log(
      generated
        .filter((g) => {
          return Object.values(g.destFilenames)[0].includes(target);
        })
        .map((g) => Object.values(g.destFilenames).map((f) => f.replace(fixtureDir, '')))
        .flat()
        .sort(),
    );
  }

  it('Should generate all project assets', async () => {
    const { run } = await import('../src/tasks/generate');

    const generated = await run(ctx);

    // log('ios', generated);
    // log('android', generated);
    // log('public', generated);

    // TODO: Make this more specific instead of "it generated a lot of assets"
    expect(generated.length).toBeGreaterThanOrEqual(77);
  });

  it('Should support custom pwa manifest dir', async () => {
    const { run } = await import('../src/tasks/generate');

    ctx.args.pwaManifestPath = 'public/custom.manifest';
    ctx.args.splashBackgroundColor = '#abcdef';

    const generated = await run(ctx);

    const manifestPath = join(fixtureDir, 'public', 'custom.manifest');
    const manifest = await readJSON(manifestPath);
    expect(manifest['background_color']).toBe('#abcdef');

    // TODO: Make this more specific instead of "it generated a lot of assets"
    expect(generated.length).toBeGreaterThanOrEqual(77);
  });
});
