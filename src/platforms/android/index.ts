import { join } from 'path';

import { InputAsset } from '../../input-asset';
import { AssetGenerator } from '../../asset-generator';
import {
  AndroidOutputAssetTemplate,
  AssetKind,
  OutputAssetTemplate,
} from '../../definitions';
import { BadPipelineError, BadProjectError } from '../../error';
import { OutputAsset } from '../../output-asset';
import { Project } from '../../project';
import { IOS_SPLASH_IMAGE_SET_PATH } from '../ios';

import * as AndroidAssetTemplates from './assets';
import { Sharp } from 'sharp';

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
    const icons = Object.values(AndroidAssetTemplates).filter(
      a => a.kind === AssetKind.Icon,
    );

    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const iosDir = project.config.ios!.path!;
    return Promise.all(
      icons.map(icon => this.generateAdaptiveIcon(icon, asset, project, pipe)),
    );
  }

  private async generateAdaptiveIcon(
    icon: AndroidOutputAssetTemplate,
    asset: InputAsset,
    project: Project,
    pipe: Sharp,
  ) {
    const androidDir = project.config.android!.path!;

    const destForeground = join(androidDir, 'app', 'src', 'main', 'res');

    const outputInfoForeground = await pipe
      .resize(icon.width, icon.height)
      .png()
      .toFile(destForeground);

    const destBackground = join(androidDir, 'app', 'src', 'main', 'res');
    const outputInfoBackground = await pipe
      .resize(icon.width, icon.height)
      .png()
      .toFile(destBackground);

    return new OutputAsset(
      icon,
      asset,
      project,
      {
        [icon.nameForeground!]: destForeground,
        [icon.nameBackground!]: destBackground,
      },
      {
        [icon.nameForeground!]: outputInfoForeground,
        [icon.nameBackground!]: outputInfoBackground,
      },
    );
  }

  private async generateSplashes(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    /*
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
    */

    return [];
  }
}
