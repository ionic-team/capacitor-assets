import { Asset } from '../../asset';
import { AssetGenerator } from '../../asset-generator';
import { AssetKind } from '../../definitions';
import { BadProjectError } from '../../error';
import { GeneratedAsset } from '../../generated-asset';
import { Project } from '../../project';

export class AndroidAssetGenerator extends AssetGenerator {
  constructor() {
    super();
  }

  async generate(asset: Asset, project: Project): Promise<GeneratedAsset[]> {
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
        return [];
      case AssetKind.Splash:
      case AssetKind.SplashDark:
        return this.generateSplashes(asset, project);
    }

    return [];
  }

  private async generateIcons(
    asset: Asset,
    project: Project,
  ): Promise<GeneratedAsset[]> {
    return [];
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
}
