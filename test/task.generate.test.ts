import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { copy, readJSON, rmSync as rm } from '@ionic/utils-fs';
import { join } from 'path';
import { temporaryDirectory } from 'tempy';

import { Context, loadContext } from '../src/ctx';

describe('Task: Generate test', () => {
  let ctx: Context;
  const fixtureDir = temporaryDirectory();

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
