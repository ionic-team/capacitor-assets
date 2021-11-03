import { join } from "path";
import { Asset } from "../../asset";
import { AssetKind } from "../../definitions";
import { BadPipelineError, BadProjectError } from "../../error";
import { GeneratedAsset } from "../../generated-asset";
import { Project } from "../../project";
import { AssetGenerationStrategy } from "../../strategy";
import { IOS_2X_UNIVERSAL_ANYANY_SPLASH, IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK } from "./assets";

export const IOS_APP_ICON_SET_NAME = 'AppIcon';
export const IOS_APP_ICON_SET_PATH = `App/App/Assets.xcassets/${IOS_APP_ICON_SET_NAME}.appiconset`;
export const IOS_SPLASH_IMAGE_SET_NAME = 'Splash';
export const IOS_SPLASH_IMAGE_SET_PATH = `App/App/Assets.xcassets/${IOS_SPLASH_IMAGE_SET_NAME}.imageset`;

export class IosAssetGenerationStrategy extends AssetGenerationStrategy {
  constructor() {
    super();
  }

  async generate(asset: Asset, project: Project): Promise<GeneratedAsset | null> {
    const iosDir = project.config.ios?.path;

    if (!iosDir) {
      throw new BadProjectError('No ios project found');
    }

    switch (asset.kind) {
      /*
      case AssetKind.Icon:
        return this.generateIcons(asset, project);
      */
      case AssetKind.Splash:
      case AssetKind.SplashDark:
        return this.generateSplashes(asset, project);
    }
    return null;
  }

  /*
  private async generateIcons(asset: Asset, project: Project): Promise<GeneratedAsset> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    return new GeneratedAsset(asset, project);
  }
  */

  private async generateSplashes(asset: Asset, project: Project): Promise<GeneratedAsset> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const assetMeta = asset.kind === AssetKind.Splash ? IOS_2X_UNIVERSAL_ANYANY_SPLASH : IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK;

    const iosDir = project.config.ios!.path!;
    const dest = join(iosDir, IOS_SPLASH_IMAGE_SET_PATH, assetMeta.name);

    pipe.png();
    pipe.toFile(dest);

    return new GeneratedAsset(assetMeta, asset, project);
  }
}