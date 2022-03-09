import { CapacitorProject } from '@capacitor/project';
import { CapacitorConfig } from '@capacitor/cli';
import { AssetKind, Assets } from './definitions';
import { join } from 'path';
import { pathExists } from '@ionic/utils-fs';
import { Asset } from './asset';
import { error } from './util/log';

export class Project extends CapacitorProject {
  assets: Assets | null = null;
  directory: string | null = null;

  assetDir: string;

  constructor(config: CapacitorConfig, assetPath: string = 'assets') {
    super(config);

    const projectRoot = join((config.android ?? config.ios)?.path ?? '', '../');
    this.directory = projectRoot;
    this.assetDir = join(projectRoot, assetPath);
  }

  assetDirectory() {
    return this.assetDir;
  }

  async loadAssets(): Promise<Assets> {
    this.assets = {
      icon: await this.loadSourceAsset('icon', AssetKind.Icon),
      splash: await this.loadSourceAsset('splash', AssetKind.Splash),
      splashDark: await this.loadSourceAsset(
        'splash-dark',
        AssetKind.SplashDark,
      ),
    };
    return this.assets;
  }

  private async loadSourceAsset(name: string, kind: AssetKind) {
    let imagePath: string | null = null;

    const extensions = ['.png', '.webp', '.jpg', '.jpeg', '.svg'];
    let filename: string | null = null;
    for (let ext of extensions) {
      filename = `${name}${ext}`;
      if (await pathExists(join(this.assetDir, filename))) {
        imagePath = join(this.assetDir, filename);
        break;
      }
    }

    if (!imagePath) {
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
