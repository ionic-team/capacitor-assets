import { mkdirp, pathExists, readFile, readJSON, rmSync, writeJSON } from '@ionic/utils-fs';
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
    // Historically this scraped Apple's HIG layout page for device sizes,
    // but the page's markup changed and the scrape silently returned an
    // empty list. The maintained static list is now the single source.
    return PWA_IOS_DEVICE_SIZES;
  }

  async generate(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const pwaDir = project.directory;

    if (!pwaDir) {
      throw new BadProjectError('No web app (PWA) found');
    }

    if (asset.platform !== Platform.Any && asset.platform !== Platform.Pwa) {
      return [];
    }

    switch (asset.kind) {
      case AssetKind.Logo:
      case AssetKind.LogoDark:
        return this.generateFromLogo(asset, project);
      case AssetKind.Icon:
        return this.generateIcons(asset, project);
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

    const splashes = await Promise.all(assetSizes.map((a) => this._generateSplashFromLogo(project, asset, a)));

    generated.push(...splashes.flat());

    return [...logos, ...generated];
  }

  private async _generateSplashFromLogo(
    project: Project,
    asset: InputAsset,
    sizeString: string,
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
    } catch (e) {
      console.log(e);
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

        let outputInfo;
        if (icon.purpose === 'maskable' || icon.excludeFromManifest) {
          // Maskable and apple-touch icons need an opaque background with
          // the art confined to the central safe zone: only a circle of
          // radius 40% is guaranteed to survive masking, and iOS applies
          // its own rounded mask to apple-touch icons.
          const safeZoneScale = 0.8;
          const scaled = await sharp(asset.path)
            .resize(Math.round(icon.width * safeZoneScale), Math.round(icon.height * safeZoneScale), {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer();

          outputInfo = await sharp({
            create: {
              width: icon.width,
              height: icon.height,
              channels: 4,
              background: this.options.iconBackgroundColor ?? '#ffffff',
            },
          })
            .composite([{ input: scaled, gravity: sharp.gravity.center }])
            .png()
            .toFile(dest);
        } else {
          outputInfo = await sharp(asset.path).resize(icon.width, icon.height).png().toFile(dest);
        }

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
    } else if (await pathExists(join(projectRoot ?? '', 'src')) /* Angular and Vue */) {
      return join(projectRoot ?? '', 'src');
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
    const pwaAssets = assets.filter((a) => a.template.platform === Platform.Pwa && !a.template.excludeFromManifest);

    let manifestJson: any = {};
    if (await pathExists(manifestPath)) {
      manifestJson = await readJSON(manifestPath);
    }

    let icons = manifestJson['icons'] || [];
    const replacedIcons = [];
    for (const asset of pwaAssets) {
      const src = asset.template.name;
      const fname = basename(src);
      const relativePath = relative(pwaDir, join(pwaAssetDir, PWA_ASSET_PATH, fname));
      replacedIcons.push(this.makeIconManifestEntry(asset.template, relativePath));
    }

    // Delete previously generated icon files that are no longer part of
    // the generated set (e.g. legacy sizes from an older version). Only
    // files inside this tool's own output directory are ever deleted —
    // manifest entries pointing elsewhere are user-managed files.
    const outputDir = join(pwaAssetDir, PWA_ASSET_PATH);
    const newSrcs = new Set(replacedIcons.map((i) => i.src));
    for (const icon of icons) {
      const iconPath = join(pwaDir, icon.src);
      const isOurs = !relative(outputDir, iconPath).startsWith('..');
      if (isOurs && !newSrcs.has(icon.src) && (await pathExists(iconPath))) {
        rmSync(iconPath);
        warn(`DELETE ${icon.src}`);
      }
    }

    icons = replacedIcons;

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
    const ext = extname(relativePath).replace('.', '');
    const posixPath = relativePath.split(sep).join(posix.sep);

    const type =
      (
        {
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          svg: 'image/svg+xml',
          webp: 'image/webp',
        } as { [key: string]: string }
      )[ext] || 'image/png';

    const entry: ManifestIcon = {
      src: posixPath,
      type,
      sizes: `${asset.width}x${asset.height}`,
    };

    if (asset.kind === AssetKind.Icon) {
      entry.purpose = asset.purpose ?? 'any';
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

  async logInstructions(project: Project, generated: OutputAsset[]): Promise<void> {
    const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
    const webPath = (g: OutputAsset): string => {
      const dest = Object.values(g.destFilenames)[0] ?? '';
      return '/' + relative(pwaDir, dest).split(sep).join(posix.sep);
    };

    const pwaAssets = generated.filter((g) => g.template.platform === Platform.Pwa);

    log(`PWA instructions:

Add the following tags to your index.html to support PWA icons and iOS splash screens:
`);

    const touchIcon = pwaAssets.find((g) => (g.template as PwaOutputAssetTemplate).name === 'apple-touch-icon.png');
    if (touchIcon) {
      log(`<link rel="apple-touch-icon" href="${webPath(touchIcon)}">`);
    }

    // apple-touch-startup-image media queries use CSS points (px / scale)
    const splashLink = (g: OutputAsset, dark: boolean, landscape: boolean): string => {
      const template = g.template as PwaOutputAssetTemplate;
      const scale = parseInt(template.density ?? '2', 10);
      const wPts = template.width / scale;
      const hPts = template.height / scale;
      const deviceW = landscape ? hPts : wPts;
      const deviceH = landscape ? wPts : hPts;
      const media = [
        ...(dark ? ['(prefers-color-scheme: dark)'] : []),
        `(device-width: ${deviceW}px)`,
        `(device-height: ${deviceH}px)`,
        `(-webkit-device-pixel-ratio: ${scale})`,
        `(orientation: ${landscape ? Orientation.Landscape : Orientation.Portrait})`,
      ].join(' and ');
      return `<link rel="apple-touch-startup-image" href="${webPath(g)}" media="${media}">`;
    };

    for (const g of pwaAssets.filter((a) => a.template.kind === AssetKind.Splash)) {
      log(splashLink(g, false, false));
      log(splashLink(g, false, true));
    }
    for (const g of pwaAssets.filter((a) => a.template.kind === AssetKind.SplashDark)) {
      log(splashLink(g, true, false));
      log(splashLink(g, true, true));
    }
  }
}
