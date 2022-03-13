import { join } from 'path';

import { InputAsset } from '../../input-asset';
import { AssetGenerator } from '../../asset-generator';
import { AssetKind } from '../../definitions';
import { BadPipelineError, BadProjectError } from '../../error';
import { OutputAsset } from '../../output-asset';
import { Project } from '../../project';
import { IOS_SPLASH_IMAGE_SET_PATH } from '../ios';
import {
  IOS_2X_UNIVERSAL_ANYANY_SPLASH,
  IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK,
} from '../ios/assets';

export class AndroidAssetGenerator extends AssetGenerator {
  constructor() {
    super();
  }

  async generate(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const androidDir = project.config.android?.path;

    if (!androidDir) {
      throw new BadProjectError('No android project found');
    }

    switch (asset.kind) {
      case AssetKind.Icon:
        return this.generateIcons(asset, project);
      /*
      case AssetKind.NotificationIcon:
        return this.generateNotificationIcons(asset, project);
      */
      case AssetKind.AdaptiveIcon:
        return this.generateAdaptiveIcons(asset, project);
      case AssetKind.Splash:
      case AssetKind.SplashDark:
        return this.generateSplashes(asset, project);
    }

    return [];
  }

  private async generateIcons(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
    return [];
  }

  private async generateAdaptiveIcons(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
    console.log('Generating adaptive icons', asset);
    return [];
  }

  private async generateSplashes(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
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

    const generated = new OutputAsset(assetMeta, asset, project, outputInfo);

    if (asset.kind === AssetKind.SplashDark) {
      // Need to register this as a dark-mode splash
      // await this.updateContentsJsonDark(generated, project);
    }

    return [generated];
  }
}
