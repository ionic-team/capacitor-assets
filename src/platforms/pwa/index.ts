import { basename, extname, join } from 'path';
import {
  mkdirp,
  pathExists,
  readFile,
  readJSON,
  writeJSON,
} from '@ionic/utils-fs';

import { InputAsset } from '../../input-asset';
import { AssetKind, PwaOutputAssetTemplate, Platform } from '../../definitions';
import { BadPipelineError, BadProjectError } from '../../error';
import { OutputAsset } from '../../output-asset';
import { Project } from '../../project';
import { AssetGenerator, AssetGeneratorOptions } from '../../asset-generator';
import * as PwaAssets from './assets';

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

  async getManifestJson(project: Project) {
    const path =
      this.options.pwaManifestPath ??
      (await this.getManifestJsonPath(project.directory ?? ''));

    const contents = await readFile(path, { encoding: 'utf-8' });

    return JSON.parse(contents);
  }

  async generate(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const pwaDir = project.directory;

    if (!pwaDir) {
      throw new BadProjectError('No web app (PWA) found');
    }

    console.log('Generating', asset.kind);
    switch (asset.kind) {
      case AssetKind.Logo:
      case AssetKind.LogoDark:
        return this.generateFromLogo(asset, project);
      case AssetKind.Icon:
        return this.generateIcons(asset, project);
      case AssetKind.Icon:
        return [];
      case AssetKind.Splash:
      case AssetKind.SplashDark:
        // PWA has no splashes
        return [];
    }
    return [];
  }

  private async generateFromLogo(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    return this.generateIcons(asset, project);
  }

  private async generateIcons(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
    const icons = Object.values(PwaAssets).filter(
      a => a.kind === AssetKind.Icon,
    ) as PwaOutputAssetTemplate[];

    const generatedAssets = await Promise.all(
      icons.map(async icon => {
        const destDir = join(
          await this.getPWAAssetsDirectory(pwaDir),
          PWA_ASSET_PATH,
        );
        try {
          await mkdirp(destDir);
        } catch {}
        const dest = join(destDir, icon.name);

        const outputInfo = await pipe
          .resize(icon.width, icon.height)
          .png()
          .toFile(dest);

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
    } else if (
      await pathExists(
        join(projectRoot ?? '', 'src/assets'),
      ) /* Angular and Vue */
    ) {
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

  private async updateManifest(
    project: Project,
    assets: OutputAsset<PwaOutputAssetTemplate>[],
  ) {
    const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
    const pwaAssetDir = await this.getPWAAssetsDirectory(pwaDir);

    const manifestPath = await this.getManifestJsonPath(
      project.directory ?? undefined,
    );
    const pwaAssets = assets.filter(a => a.template.platform === Platform.Pwa);

    console.log('Updating pwa manifest', pwaDir, pwaAssetDir, manifestPath);
    let manifestJson: any = {};
    if (await pathExists(manifestPath)) {
      manifestJson = await readJSON(manifestPath);
    }

    const icons = manifestJson['icons'] || [];

    for (let asset of pwaAssets) {
      const src = asset.template.name;
      const fname = basename(src);
      const relativePath = join(pwaAssetDir, PWA_ASSET_PATH, fname);

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

    console.log('Writing manifest', manifestPath);
    await writeJSON(manifestPath, jsonOutput, {
      spaces: 2,
    });
  }

  private makeIconManifestEntry(
    asset: PwaOutputAssetTemplate,
    relativePath: string,
  ): ManifestIcon {
    const ext = extname(relativePath);

    const type =
      (
        {
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          svg: 'image/svg+xml',
        } as { [key: string]: string }
      )[ext] || 'image/png';

    let entry: ManifestIcon = {
      src: relativePath,
      type,
      sizes: `${asset.width}x${asset.height}`,
    };

    if (asset.kind === AssetKind.Icon) {
      entry.purpose = 'any maskable';
    }

    return entry;
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
