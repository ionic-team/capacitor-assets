import { mkdirp, pathExists, readFile, readJSON, writeJSON } from '@ionic/utils-fs';
import fetch from 'node-fetch';
import parse from 'node-html-parser';
import { basename, extname, join, posix, relative, sep } from 'path';
import type { Sharp } from 'sharp';
import sharp from 'sharp';

import type { AssetGeneratorOptions } from '../../asset-generator';
import { AssetGenerator } from '../../asset-generator';
import type { PwaOutputAssetTemplate } from '../../definitions';
import { AssetKind, Platform, Format, Orientation } from '../../definitions';
import { BadPipelineError, BadProjectError } from '../../error';
import type { InputAsset } from '../../input-asset';
import { OutputAsset } from '../../output-asset';
import type { Project } from '../../project';
import { log, warn } from '../../util/log';

import { ASSETS as PwaAssets, PWA_IOS_DEVICE_SIZES } from './assets';

export const PWA_ASSET_PATH = 'icons';

export interface ManifestIcon {
  src: string;
  size?: string | number;
  sizes?: string;
  destination?: string;
  purpose?: string;
  type?: string;
}

export class PwaAssetGenerator extends AssetGenerator {
  constructor(options: AssetGeneratorOptions = {}) {
    super(options);
  }

  async getManifestJson(project: Project): Promise<any> {
    const path = await this.getManifestJsonPath(project.directory ?? '');

    const contents = await readFile(path, { encoding: 'utf-8' });

    return JSON.parse(contents);
  }

  async getSplashSizes(): Promise<string[]> {
    const appleInterfacePage = `https://developer.apple.com/design/human-interface-guidelines/foundations/layout/`;

    let assetSizes = PWA_IOS_DEVICE_SIZES;
    if (!this.options.pwaNoAppleFetch) {
      try {
        const res = await fetch(appleInterfacePage);

        const html = await res.text();

        const doc = parse(html);

        const target = doc.querySelector('main > section .row > .column table');
        const sizes = target?.querySelectorAll('tr > td:nth-child(2)') ?? [];
        const sizeStrings = sizes.map((td) => {
          const t = td.innerText;
          return t
            .slice(t.indexOf('pt (') + 4)
            .slice(0, -1)
            .replace(' px ', '');
        });

        const deduped = new Set(sizeStrings);

        assetSizes = Array.from(deduped);
      } catch (e) {
        warn(
          `Unable to load iOS HIG screen sizes to generate iOS PWA splash screens. Using local snapshot of device sizes. Use --pwaNoAppleFetch true to always use local sizes`,
        );
      }
    }

    return assetSizes;
  }

  async generate(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const pwaDir = project.directory;

    if (!pwaDir) {
      throw new BadProjectError('No web app (PWA) found');
    }

    if (asset.platform !== Platform.Any) {
      return [];
    }

    switch (asset.kind) {
      case AssetKind.Logo:
      case AssetKind.LogoDark:
        return this.generateFromLogo(asset, project);
      case AssetKind.Icon:
        return this.generateIcons(asset, project);
      // eslint-disable-next-line no-duplicate-case
      case AssetKind.Icon:
        return [];
      case AssetKind.Splash:
      case AssetKind.SplashDark:
        // PWA has no splashes
        return this.generateSplashes(asset, project);
    }
    return [];
  }

  private async generateFromLogo(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    // Generate logos
    const logos = await this.generateIcons(asset, project);

    const assetSizes = await this.getSplashSizes();

    const generated: OutputAsset[] = [];

    const splashes = await Promise.all(assetSizes.map((a) => this._generateSplashFromLogo(project, asset, a, pipe)));

    generated.push(...splashes.flat());

    return [...logos, ...generated];
  }

  private async _generateSplashFromLogo(
    project: Project,
    asset: InputAsset,
    sizeString: string,
    pipe: Sharp,
  ): Promise<OutputAsset[]> {
    const parts = sizeString.split('@');
    const sizeParts = parts[0].split('x');
    const width = parseFloat(sizeParts[0]);
    const height = parseFloat(sizeParts[1]);
    const density = parts[1];

    const generated: OutputAsset[] = [];

    const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
    const pwaAssetDir = await this.getPWAAssetsDirectory(pwaDir);
    const destDir = join(pwaAssetDir, PWA_ASSET_PATH);
    try {
      await mkdirp(destDir);
    } catch {
      // ignore error
    }

    // TODO: In the future, add size checks to ensure canvas image
    // is not exceeded (see Android splash generation)
    const targetLogoWidthPercent = this.options.logoSplashScale ?? 0.2;
    const targetWidth = this.options.logoSplashTargetWidth ?? Math.floor(width * targetLogoWidthPercent);

    if (asset.kind === AssetKind.Logo) {
      // Generate light splash
      const lightDefaultBackground = '#ffffff';
      const lightDest = join(destDir, `apple-splash-${width}-${height}@${density}.png`);

      const canvas = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: lightDefaultBackground,
        },
      });

      const resized = await sharp(asset.path).resize(targetWidth).toBuffer();

      const lightOutputInfo = await canvas
        .composite([{ input: resized, gravity: sharp.gravity.center }])
        .png()
        .toFile(lightDest);

      const template: PwaOutputAssetTemplate = {
        name: `apple-splash-${width}-${height}@${density}.png`,
        platform: Platform.Pwa,
        kind: AssetKind.Splash,
        format: Format.Png,
        orientation: Orientation.Portrait,
        density: density[0],
        width,
        height,
      };

      const lightSplashOutput = new OutputAsset(
        template,
        asset,
        project,
        {
          [lightDest]: lightDest,
        },
        {
          [lightDest]: lightOutputInfo,
        },
      );

      generated.push(lightSplashOutput);
    }

    // Generate dark splash
    const darkDefaultBackground = '#111111';
    const darkDest = join(destDir, `apple-splash-${width}-${height}@${density}-dark.png`);

    const canvas = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: darkDefaultBackground,
      },
    });

    const resized = await sharp(asset.path).resize(targetWidth).toBuffer();

    const darkOutputInfo = await canvas
      .composite([{ input: resized, gravity: sharp.gravity.center }])
      .png()
      .toFile(darkDest);

    const template: PwaOutputAssetTemplate = {
      name: `apple-splash-${width}-${height}@${density}-dark.png`,
      platform: Platform.Pwa,
      kind: AssetKind.SplashDark,
      format: Format.Png,
      orientation: Orientation.Portrait,
      density: density[0],
      width,
      height,
    };
    const darkSplashOutput = new OutputAsset(
      template,
      asset,
      project,
      {
        [darkDest]: darkDest,
      },
      {
        [darkDest]: darkOutputInfo,
      },
    );

    generated.push(darkSplashOutput);

    return generated;
  }

  private async generateIcons(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
    const icons = Object.values(PwaAssets).filter((a) => a.kind === AssetKind.Icon) as PwaOutputAssetTemplate[];

    const generatedAssets = await Promise.all(
      icons.map(async (icon) => {
        const destDir = join(await this.getPWAAssetsDirectory(pwaDir), PWA_ASSET_PATH);
        try {
          await mkdirp(destDir);
        } catch {
          // ignore error
        }
        const dest = join(destDir, icon.name);

        const outputInfo = await pipe.resize(icon.width, icon.height).png().toFile(dest);

        return new OutputAsset(
          icon,
          asset,
          project,
          {
            [icon.name]: dest,
          },
          {
            [icon.name]: outputInfo,
          },
        );
      }),
    );

    await this.updateManifest(project, generatedAssets);

    return generatedAssets;
  }

  private async getPWADirectory(projectRoot?: string): Promise<string> {
    if (await pathExists(join(projectRoot ?? '', 'public')) /* React */) {
      return join(projectRoot ?? '', 'public');
    } else if (await pathExists(join(projectRoot ?? '', 'src/assets')) /* Angular and Vue */) {
      return join(projectRoot ?? '', 'src/assets');
    } else if (await pathExists(join(projectRoot ?? '', 'www'))) {
      return join(projectRoot ?? '', 'www');
    } else {
      return join(projectRoot ?? '', 'www');
    }
  }

  private async getPWAAssetsDirectory(pwaDir?: string): Promise<string> {
    if (await pathExists(join(pwaDir ?? '', 'assets'))) {
      return join(pwaDir ?? '', 'assets');
    }
    return '';
  }

  private async getManifestJsonPath(projectRoot?: string): Promise<string> {
    const r = (p: string) => join(projectRoot ?? '', p);

    if (this.options.pwaManifestPath) {
      return r(this.options.pwaManifestPath);
    }

    if (await pathExists(r('public'))) {
      if (await pathExists(r('public/manifest.json'))) {
        return r('public/manifest.json');
      }

      // Default to the spec-preferred naming
      return r('public/manifest.webmanifest');
    } else if (await pathExists(r('src/assets'))) {
      if (await pathExists(r('src/manifest.json'))) {
        return r('src/manifest.json');
      }

      // Default to the spec-preferred naming
      return r('src/manifest.webmanifest');
    } else if (await pathExists(r('www'))) {
      if (await pathExists(r('www'))) {
        return r('www/manifest.json');
      }

      // Default to the spec-preferred naming
      return r('www/manifest.webmanifest');
    } else {
      // Safe fallback to older styles
      return r('www/manifest.json');
    }
  }

  private async updateManifest(project: Project, assets: OutputAsset<PwaOutputAssetTemplate>[]) {
    const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
    const pwaAssetDir = await this.getPWAAssetsDirectory(pwaDir);

    const manifestPath = await this.getManifestJsonPath(project.directory ?? undefined);
    const pwaAssets = assets.filter((a) => a.template.platform === Platform.Pwa);

    let manifestJson: any = {};
    if (await pathExists(manifestPath)) {
      manifestJson = await readJSON(manifestPath);
    }

    const icons = manifestJson['icons'] || [];

    for (const asset of pwaAssets) {
      const src = asset.template.name;
      const fname = basename(src);
      const relativePath = relative(pwaDir, join(pwaAssetDir, PWA_ASSET_PATH, fname));

      const existing = !!icons.find((i: any) => i.src === relativePath);
      if (!existing) {
        icons.push(this.makeIconManifestEntry(asset.template, relativePath));
      }
    }

    // Update the manifest background color to the splash one if provided to ensure
    // platform automatic splash generation works
    if (this.options.splashBackgroundColor) {
      manifestJson['background_color'] = this.options.splashBackgroundColor;
    }

    const jsonOutput = {
      ...manifestJson,
      icons,
    };

    await writeJSON(manifestPath, jsonOutput, {
      spaces: 2,
    });
  }

  private makeIconManifestEntry(asset: PwaOutputAssetTemplate, relativePath: string): ManifestIcon {
    const ext = extname(relativePath);
    const posixPath = relativePath.split(sep).join(posix.sep);

    const type =
      (
        {
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          svg: 'image/svg+xml',
        } as { [key: string]: string }
      )[ext] || 'image/png';

    const entry: ManifestIcon = {
      src: posixPath,
      type,
      sizes: `${asset.width}x${asset.height}`,
    };

    if (asset.kind === AssetKind.Icon) {
      entry.purpose = 'any maskable';
    }

    return entry;
  }

  private async generateSplashes(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const assetSizes = await this.getSplashSizes();

    return Promise.all(assetSizes.map((a) => this._generateSplash(project, asset, a, pipe)));
  }

  private async _generateSplash(
    project: Project,
    asset: InputAsset,
    sizeString: string,
    pipe: Sharp,
  ): Promise<OutputAsset> {
    const parts = sizeString.split('@');
    const sizeParts = parts[0].split('x');
    const width = parseFloat(sizeParts[0]);
    const height = parseFloat(sizeParts[1]);
    const density = parts[1];
    const name = `apple-splash-${width}-${height}@${density}${asset.kind === AssetKind.SplashDark ? '-dark' : ''}.png`;

    const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
    const pwaAssetDir = await this.getPWAAssetsDirectory(pwaDir);
    const destDir = join(pwaAssetDir, PWA_ASSET_PATH);
    try {
      await mkdirp(destDir);
    } catch {
      // ignore error
    }
    const dest = join(destDir, name);

    // console.log(width, height);
    const targetLogoWidthPercent = this.options.logoSplashScale ?? 0.2;
    const targetWidth = Math.floor(width * targetLogoWidthPercent);
    const outputInfo = await pipe.resize(width, height).png().toFile(dest);

    const template: PwaOutputAssetTemplate = {
      name,
      platform: Platform.Pwa,
      kind: AssetKind.Splash,
      format: Format.Png,
      orientation: Orientation.Portrait,
      density: density[0],
      width,
      height,
    };

    const splashOutput = new OutputAsset(
      template,
      asset,
      project,
      {
        [dest]: dest,
      },
      {
        [dest]: outputInfo,
      },
    );

    return splashOutput;
  }

  static logInstructions(generated: OutputAsset[]): void {
    log(`PWA instructions:

Add the following tags to your index.html to support PWA icons:
`);
    const pwaAssets = generated.filter((g) => g.template.platform === Platform.Pwa);

    const mainIcon = pwaAssets.find((g) => g.template.width == 512 && g.template.kind === AssetKind.Icon);

    log(`<link rel="apple-touch-icon" href="${Object.values(mainIcon?.destFilenames ?? {})[0]}">`);

    for (const g of pwaAssets.filter((a) => a.template.kind === AssetKind.Icon)) {
      const w = g.template.width;
      const h = g.template.height;
      const path = Object.values(g.destFilenames)[0] ?? '';
      log(`<link rel="apple-touch-icon" sizes="${w}x${h}" href="${path}">`);
    }

    for (const g of pwaAssets.filter((a) => a.template.kind === AssetKind.Splash)) {
      const template = g.template as PwaOutputAssetTemplate;
      const w = g.template.width;
      const h = g.template.height;
      const path = Object.values(g.destFilenames)[0] ?? '';
      log(
        `<link rel="apple-touch-startup-image" href="${path}" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${template.density}) and (orientation: ${Orientation.Portrait})>`,
      );
    }
    for (const g of pwaAssets.filter((a) => a.template.kind === AssetKind.Splash)) {
      const template = g.template as PwaOutputAssetTemplate;
      const w = g.template.width;
      const h = g.template.height;
      const path = Object.values(g.destFilenames)[0] ?? '';
      log(
        `<link rel="apple-touch-startup-image" href="${path}" media="(device-width: ${h}px) and (device-height: ${w}px) and (-webkit-device-pixel-ratio: ${template.density}) and (orientation: ${Orientation.Landscape})>`,
      );
    }
    for (const g of pwaAssets.filter((a) => a.template.kind === AssetKind.SplashDark)) {
      const template = g.template as PwaOutputAssetTemplate;
      const w = g.template.width;
      const h = g.template.height;
      const path = Object.values(g.destFilenames)[0] ?? '';
      log(
        `<link rel="apple-touch-startup-image" href="${path}" media="(prefers-color-scheme: dark) and (device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${template.density}) and (orientation: ${Orientation.Portrait})>`,
      );
    }
    for (const g of pwaAssets.filter((a) => a.template.kind === AssetKind.SplashDark)) {
      const template = g.template as PwaOutputAssetTemplate;
      const w = g.template.width;
      const h = g.template.height;
      const path = Object.values(g.destFilenames)[0] ?? '';
      log(
        `<link rel="apple-touch-startup-image" href="${path}" media="(prefers-color-scheme: dark) and (device-width: ${h}px) and (device-height: ${w}px) and (-webkit-device-pixel-ratio: ${template.density}) and (orientation: ${Orientation.Landscape})>`,
      );
    }

    console.log(
      'Generated',
      pwaAssets.filter((a) => a.template.kind === AssetKind.Splash).length,
      pwaAssets.filter((a) => a.template.kind === AssetKind.SplashDark).length,
    );

    /*
    for (const g of pwaAssets.filter(a => a.template.kind === AssetKind.Splash)) {
      const w = g.template.width;
      const h = g.template.height;
      const path = Object.values(g.destFilenames)[0] ?? '';
      log(`<link rel="apple-touch-startup-image" href="${path}" media="(device-width: ${w}px) and (device-height: ${h}px) and (orientation: ${g.template>`);
    }
    */
  }
}
/*
export async function copyIcons(
  resourcePath: string,
  projectPath: string,
  logstream: NodeJS.WritableStream | null,
  errstream: NodeJS.WritableStream | null,
): Promise<number> {
  const source = join(resourcePath, SOURCE_PWA_ICON);
  const dest = join(projectPath, PWA_ASSET_PATH);

  await Promise.all(copyImages(source, dest, PWA_ICONS, logstream, errstream));

  return PWA_ICONS.length;
}
*/
