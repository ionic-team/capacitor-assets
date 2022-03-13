import { basename, extname, join } from 'path';
import {
  existsSync,
  mkdirp,
  readFile,
  readFileSync,
  writeFileSync,
} from '@ionic/utils-fs';

import { InputAsset } from '../../input-asset';
import { AssetKind, PwaAssetMeta, Platform } from '../../definitions';
import { BadPipelineError, BadProjectError } from '../../error';
import { OutputAsset } from '../../output-asset';
import { Project } from '../../project';
import { AssetGenerator } from '../../asset-generator';
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
  constructor() {
    super();
  }

  async getManifestJson(project: Project) {
    const path = this.getManifestJsonPath(project.directory ?? '');

    const contents = await readFile(path, { encoding: 'utf-8' });

    return JSON.parse(contents);
  }

  async generate(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const pwaDir = project.directory;

    if (!pwaDir) {
      throw new BadProjectError('No web app (PWA) found');
    }

    switch (asset.kind) {
      case AssetKind.Icon:
        return this.generateIcons(asset, project);
      case AssetKind.AdaptiveIcon:
        return [];
      case AssetKind.Splash:
      case AssetKind.SplashDark:
        // PWA has no splashes
        return [];
    }
    return [];
  }

  private async generateIcons(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const pwaDir = this.getPWADirectory(project.directory ?? undefined);
    const icons = Object.values(PwaAssets).filter(
      a => a.kind === AssetKind.Icon,
    ) as PwaAssetMeta[];

    const generatedAssets = await Promise.all(
      icons.map(async icon => {
        const destDir = join(
          this.getPWAAssetsDirectory(pwaDir),
          PWA_ASSET_PATH,
        );
        try {
          await mkdirp(destDir);
        } catch {}
        const dest = join(destDir, icon.name);
        icon.dest = dest;

        const outputInfo = await pipe
          .resize(icon.width, icon.height)
          .png()
          .toFile(dest);

        return new OutputAsset(icon, asset, project, outputInfo);
      }),
    );

    await this.updateManifest(project, generatedAssets);

    return generatedAssets;
  }

  private getPWADirectory(projectRoot?: string): string {
    if (existsSync(join(projectRoot ?? '', 'public')) /* React */) {
      return join(projectRoot ?? '', 'public');
    } else if (
      existsSync(join(projectRoot ?? '', 'src/assets')) /* Angular and Vue */
    ) {
      return join(projectRoot ?? '', 'src/assets');
    } else if (existsSync(join(projectRoot ?? '', 'www'))) {
      return join(projectRoot ?? '', 'www');
    } else {
      return join(projectRoot ?? '', 'www');
    }
  }

  private getPWAAssetsDirectory(pwaDir?: string): string {
    if (existsSync(join(pwaDir ?? '', 'assets'))) {
      return join(pwaDir ?? '', 'assets');
    }
    return '';
  }

  private getManifestJsonPath(projectRoot?: string): string {
    const r = (p: string) => join(projectRoot ?? '', p);

    if (existsSync(r('public'))) {
      if (existsSync(r('public/manifest.json'))) {
        return r('public/manifest.json');
      }

      // Default to the spec-preferred naming
      return r('public/manifest.webmanifest');
    } else if (existsSync(r('src/assets'))) {
      if (existsSync(r('src/manifest.json'))) {
        return r('src/manifest.json');
      }

      // Default to the spec-preferred naming
      return r('src/manifest.webmanifest');
    } else if (existsSync(r('www'))) {
      if (existsSync(r('www'))) {
        return r('www/manifest.json');
      }

      // Default to the spec-preferred naming
      return r('www/manifest.webmanifest');
    } else {
      // Safe fallback to older styles
      return r('www/manifest.json');
    }
  }

  private updateManifest(
    project: Project,
    assets: OutputAsset<PwaAssetMeta>[],
  ) {
    const pwaDir = this.getPWADirectory(project.directory ?? undefined);
    const pwaAssetDir = this.getPWAAssetsDirectory(pwaDir);

    const manifestPath = this.getManifestJsonPath(
      project.directory ?? undefined,
    );
    const pwaAssets = assets.filter(a => a.meta.platform === Platform.Pwa);

    let manifestJson: any = {};
    if (existsSync(manifestPath)) {
      manifestJson = JSON.parse(
        readFileSync(manifestPath, { encoding: 'utf-8' }),
      );
    }

    const icons = manifestJson['icons'] || [];

    for (let asset of pwaAssets) {
      const src = asset.meta.name;
      const fname = basename(src);
      const relativePath = join(pwaAssetDir, PWA_ASSET_PATH, fname);

      const existing = !!icons.find((i: any) => i.src === relativePath);
      if (!existing) {
        icons.push(this.makeIconManifestEntry(asset.meta, relativePath));
      }
    }

    const jsonOutput = JSON.stringify(
      {
        ...manifestJson,
        icons,
      },
      null,
      2,
    );

    writeFileSync(manifestPath, jsonOutput);
  }

  private makeIconManifestEntry(
    asset: PwaAssetMeta,
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

    if (asset.kind === AssetKind.AdaptiveIcon) {
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
