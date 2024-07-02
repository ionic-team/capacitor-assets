import { pathExists } from '@ionic/utils-fs';
import type { MobileProjectConfig } from '@trapezedev/project';
import { MobileProject } from '@trapezedev/project';
import { join } from 'path';

import type { Assets } from './definitions';
import { AssetKind, Platform } from './definitions';
import { InputAsset } from './input-asset';
import { error } from './util/log';

export class Project extends MobileProject {
  assets: Assets | null = null;
  directory: string | null = null;

  assetDir: string;

  constructor(
    projectRoot: string = process.cwd(),
    config: MobileProjectConfig,
    private assetPath: string = 'assets',
  ) {
    super(projectRoot, config);

    this.directory = projectRoot;
    this.assetDir = join(projectRoot, assetPath);

    this.detectAssetDir();
  }

  async detectAssetDir(): Promise<void> {
    if (this.assetPath === 'assets' && !(await pathExists(this.assetDir))) {
      this.assetDir = join(this.projectRoot, 'resources');
    }
  }

  async androidExists(): Promise<boolean> {
    return this.config.android?.path !== undefined && (await pathExists(this.config.android?.path));
  }

  async iosExists(): Promise<boolean> {
    return this.config.ios?.path !== undefined && (await pathExists(this.config.ios?.path));
  }

  async assetDirExists(): Promise<boolean> {
    return pathExists(this.assetDir);
  }

  assetDirectory(): string {
    return this.assetDir;
  }

  async loadInputAssets(): Promise<Assets> {
    this.assets = {
      logo: await this.loadLogoInputAsset(),
      logoDark: await this.loadInputAsset('logo-dark', AssetKind.LogoDark, Platform.Any),
      icon: await this.loadInputAsset('icon-only', AssetKind.Icon, Platform.Any),
      iconForeground: await this.loadInputAsset('icon-foreground', AssetKind.IconForeground, Platform.Any),
      iconBackground: await this.loadInputAsset('icon-background', AssetKind.IconBackground, Platform.Any),
      splash: await this.loadInputAsset('splash', AssetKind.Splash, Platform.Any),
      splashDark: await this.loadInputAsset('splash-dark', AssetKind.SplashDark, Platform.Any),

      iosIcon: await this.loadInputAsset('ios/icon', AssetKind.Icon, Platform.Ios),
      iosSplash: await this.loadInputAsset('ios/splash', AssetKind.Splash, Platform.Ios),
      iosSplashDark: await this.loadInputAsset('ios/splash-dark', AssetKind.SplashDark, Platform.Ios),

      androidIcon: await this.loadInputAsset('android/icon', AssetKind.Icon, Platform.Android),
      androidIconForeground: await this.loadInputAsset('android/icon-foreground', AssetKind.Icon, Platform.Android),
      androidIconBackground: await this.loadInputAsset('android/icon-background', AssetKind.Icon, Platform.Android),

      androidBanner: await this.loadInputAsset('android/banner', AssetKind.Banner, Platform.Android),
      androidSplash: await this.loadInputAsset('android/splash', AssetKind.Splash, Platform.Android),
      androidSplashDark: await this.loadInputAsset('android/splash-dark', AssetKind.SplashDark, Platform.Android),
      androidNotificationIcon: await this.loadInputAsset(
        'android/notification',
        AssetKind.NotificationIcon,
        Platform.Android,
      ),
    };
    return this.assets;
  }

  private async loadLogoInputAsset() {
    let logo = await this.loadInputAsset('logo', AssetKind.Logo, Platform.Any);
    if (!logo) {
      logo = await this.loadInputAsset('icon', AssetKind.Logo, Platform.Any);
    }
    return logo;
  }

  private async loadInputAsset(path: string, kind: AssetKind, platform: Platform) {
    let imagePath: string | null = null;

    const extensions = ['.png', '.webp', '.jpg', '.jpeg', '.svg'];
    let filename: string | null = null;
    for (const ext of extensions) {
      filename = `${path}${ext}`;
      if (await pathExists(join(this.assetDir, filename))) {
        imagePath = join(this.assetDir, filename);
        break;
      }
    }

    if (!imagePath) {
      return null;
    }

    const asset = new InputAsset(imagePath, kind, platform);

    try {
      await asset.load();
      return asset;
    } catch (e) {
      error(`Unable to load source image ${filename}: ${(e as any).message}`);
      return null;
    }
  }
}
