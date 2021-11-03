import { CapacitorProject } from '@capacitor/project';
import { CapacitorConfig } from '@capacitor/cli';
import { AssetKind, Assets } from './definitions';
import { join } from 'path';
import { pathExists } from '@ionic/utils-fs';
import { Asset } from './asset';
import { error } from './util/log';

export class Project extends CapacitorProject {
  assets: Assets | null = null;

  constructor(config: CapacitorConfig) {
    super(config);
  }

  async loadAssets(): Promise<Assets> {
    this.assets = {
      icon: await this.loadSourceAsset('icon.png', AssetKind.Icon),
      splash: await this.loadSourceAsset('splash.png', AssetKind.Splash),
      splashDark: await this.loadSourceAsset('splash-dark.png', AssetKind.SplashDark),
    }
    return this.assets;
  }

  private async loadSourceAsset(filename: string, kind: AssetKind) {
    const projectRoot = join((this.config.android ?? this.config.ios)?.path ?? '', '../');
    const imagePath = join(projectRoot, 'resources', filename);
    if (!(await pathExists(imagePath))) {
      return null;
    }

    const asset = new Asset(imagePath, kind);

    try {
      await asset.load();
      return asset;
    } catch (e) {
      error(`Unable to load source image ${filename}: ${(e as any).message}`);
      return null;
    }
  }
}