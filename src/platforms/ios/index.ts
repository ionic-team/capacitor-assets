import { join } from 'path';
import { readFile, writeFile } from '@ionic/utils-fs';

import { Asset } from '../../asset';
import { AssetKind, AssetMeta, IosAssetMeta } from '../../definitions';
import { BadPipelineError, BadProjectError } from '../../error';
import { GeneratedAsset } from '../../generated-asset';
import { Project } from '../../project';
import { AssetGenerator } from '../../asset-generator';
import {
  IOS_2X_UNIVERSAL_ANYANY_SPLASH,
  IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK,
} from './assets';
import * as IosAssets from './assets';

export const IOS_APP_ICON_SET_NAME = 'AppIcon';
export const IOS_APP_ICON_SET_PATH = `App/App/Assets.xcassets/${IOS_APP_ICON_SET_NAME}.appiconset`;
export const IOS_SPLASH_IMAGE_SET_NAME = 'Splash';
export const IOS_SPLASH_IMAGE_SET_PATH = `App/App/Assets.xcassets/${IOS_SPLASH_IMAGE_SET_NAME}.imageset`;

export class IosAssetGenerator extends AssetGenerator {
  constructor() {
    super();
  }

  async generate(asset: Asset, project: Project): Promise<GeneratedAsset[]> {
    const iosDir = project.config.ios?.path;

    if (!iosDir) {
      throw new BadProjectError('No ios project found');
    }

    switch (asset.kind) {
      case AssetKind.Icon:
        return this.generateIcons(asset, project);
      case AssetKind.NotificationIcon:
        return this.generateNotificationIcons(asset, project);
      case AssetKind.AdaptiveIcon:
        return [];
      case AssetKind.SettingsIcon:
        return this.generateSettingsIcons(asset, project);
      case AssetKind.SpotlightIcon:
        return this.generateSpotlightIcons(asset, project);
      case AssetKind.Splash:
      case AssetKind.SplashDark:
        return this.generateSplashes(asset, project);
    }
  }

  private async _generateIcons(
    asset: Asset,
    project: Project,
    icons: IosAssetMeta[],
  ): Promise<GeneratedAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const iosDir = project.config.ios!.path!;
    return Promise.all(
      icons.map(async icon => {
        const dest = join(iosDir, IOS_APP_ICON_SET_PATH, icon.name);
        icon.dest = dest;

        const outputInfo = await pipe
          .resize(icon.width, icon.height)
          .png()
          .toFile(dest);

        return new GeneratedAsset(icon, asset, project, outputInfo);
      }),
    );
  }

  private async generateIcons(
    asset: Asset,
    project: Project,
  ): Promise<GeneratedAsset[]> {
    const icons = Object.values(IosAssets).filter(
      a => a.kind === AssetKind.Icon,
    );

    return this._generateIcons(asset, project, icons as IosAssetMeta[]);
  }

  private async generateNotificationIcons(
    asset: Asset,
    project: Project,
  ): Promise<GeneratedAsset[]> {
    const icons = Object.values(IosAssets).filter(
      a => a.kind === AssetKind.NotificationIcon,
    );

    return this._generateIcons(asset, project, icons as IosAssetMeta[]);
  }

  private async generateSettingsIcons(
    asset: Asset,
    project: Project,
  ): Promise<GeneratedAsset[]> {
    const icons = Object.values(IosAssets).filter(
      a => a.kind === AssetKind.SettingsIcon,
    );

    return this._generateIcons(asset, project, icons as IosAssetMeta[]);
  }

  private async generateSpotlightIcons(
    asset: Asset,
    project: Project,
  ): Promise<GeneratedAsset[]> {
    const icons = Object.values(IosAssets).filter(
      a => a.kind === AssetKind.SpotlightIcon,
    );

    return this._generateIcons(asset, project, icons as IosAssetMeta[]);
  }

  private async generateSplashes(
    asset: Asset,
    project: Project,
  ): Promise<GeneratedAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const assetMeta =
      asset.kind === AssetKind.Splash
        ? IOS_2X_UNIVERSAL_ANYANY_SPLASH
        : IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK;

    const iosDir = project.config.ios!.path!;
    const dest = join(iosDir, IOS_SPLASH_IMAGE_SET_PATH, assetMeta.name);
    assetMeta.dest = dest;

    const outputInfo = await pipe
      .resize(assetMeta.width, assetMeta.height)
      .png()
      .toFile(dest);

    const generated = new GeneratedAsset(assetMeta, asset, project, outputInfo);

    if (asset.kind === AssetKind.SplashDark) {
      // Need to register this as a dark-mode splash
      await this.updateContentsJsonDark(generated, project);
    }

    return [generated];
  }

  private async updateContentsJsonDark(
    generated: GeneratedAsset,
    project: Project,
  ) {
    const contentsJsonPath = join(
      project.config.ios!.path!,
      IOS_SPLASH_IMAGE_SET_PATH,
      'Contents.json',
    );
    const json = await readFile(contentsJsonPath, { encoding: 'utf-8' });

    const parsed = JSON.parse(json);

    const withoutMissing = parsed.images.filter((i: any) => !!i.filename);
    withoutMissing.push({
      appearances: [
        {
          appearance: 'luminosity',
          value: 'dark',
        },
      ],
      idiom: 'universal',
      scale: `${generated.meta.scale ?? 1}x`,
      filename: (generated.meta as IosAssetMeta).name,
    });

    parsed.images = withoutMissing;

    await writeFile(contentsJsonPath, JSON.stringify(parsed, null, 2));
  }
}
