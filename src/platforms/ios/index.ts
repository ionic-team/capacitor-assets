import { join } from 'path';
import { readFile, writeFile } from '@ionic/utils-fs';

import { InputAsset } from '../../input-asset';
import { AssetKind, IosOutputAssetTemplate } from '../../definitions';
import { BadPipelineError, BadProjectError } from '../../error';
import { OutputAsset } from '../../output-asset';
import { Project } from '../../project';
import { AssetGenerator, AssetGeneratorOptions } from '../../asset-generator';
import {
  IOS_2X_UNIVERSAL_ANYANY_SPLASH,
  IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK,
} from './assets';
import * as IosAssetTemplates from './assets';
import sharp from 'sharp';

export const IOS_APP_ICON_SET_NAME = 'AppIcon';
export const IOS_APP_ICON_SET_PATH = `App/App/Assets.xcassets/${IOS_APP_ICON_SET_NAME}.appiconset`;
export const IOS_SPLASH_IMAGE_SET_NAME = 'Splash';
export const IOS_SPLASH_IMAGE_SET_PATH = `App/App/Assets.xcassets/${IOS_SPLASH_IMAGE_SET_NAME}.imageset`;

export class IosAssetGenerator extends AssetGenerator {
  constructor(options: AssetGeneratorOptions = {}) {
    super(options);
  }

  async generate(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const iosDir = project.config.ios?.path;

    if (!iosDir) {
      throw new BadProjectError('No ios project found');
    }

    switch (asset.kind) {
      case AssetKind.Logo:
      case AssetKind.LogoDark:
        return this.generateFromLogo(asset, project);
      case AssetKind.Icon:
        return this.generateIcons(asset, project);
      case AssetKind.NotificationIcon:
        return this.generateNotificationIcons(asset, project);
      case AssetKind.Icon:
        return [];
      case AssetKind.SettingsIcon:
        return this.generateSettingsIcons(asset, project);
      case AssetKind.SpotlightIcon:
        return this.generateSpotlightIcons(asset, project);
      case AssetKind.Splash:
      case AssetKind.SplashDark:
        return this.generateSplashes(asset, project);
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

    const iosDir = project.config.ios!.path!;

    // Generate logos
    const logos = await this.generateIcons(asset, project);

    console.log('Generating from logo', asset.kind);

    const generated: OutputAsset[] = [];

    if (asset.kind === AssetKind.Logo) {
      // Generate light splash
      const lightDefaultBackground = '#ffffff';
      const lightSplash = IOS_2X_UNIVERSAL_ANYANY_SPLASH;
      const lightDest = join(
        iosDir,
        IOS_SPLASH_IMAGE_SET_PATH,
        lightSplash.name,
      );
      const lightExtend = lightSplash.width - (asset.width ?? 0);
      const lightOutputInfo = await pipe
        .extend({
          top: lightExtend,
          right: lightExtend,
          bottom: lightExtend,
          left: lightExtend,
          background: this.options.backgroundColor ?? lightDefaultBackground,
        })
        .flatten({
          background: this.options.backgroundColor ?? lightDefaultBackground,
        })
        .resize(lightSplash.width, lightSplash.height, {
          fit: sharp.fit.outside,
          position: sharp.gravity.center,
          background: this.options.backgroundColor ?? lightDefaultBackground,
        })
        .png()
        .toFile(lightDest);

      const lightSplashOutput = new OutputAsset(
        lightSplash,
        asset,
        project,
        {
          [lightDest]: lightDest,
        },
        {
          [lightDest]: lightOutputInfo,
        },
      );

      generated.push(lightSplashOutput);
    }

    // Generate dark splash
    const darkDefaultBackground = '#111111';
    const darkSplash = IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK;
    const darkDest = join(iosDir, IOS_SPLASH_IMAGE_SET_PATH, darkSplash.name);
    const darkExtend = darkSplash.width - (asset.width ?? 0);
    const darkOutputInfo = await pipe
      .extend({
        top: darkExtend,
        right: darkExtend,
        bottom: darkExtend,
        left: darkExtend,
        background: this.options.backgroundColorDark ?? darkDefaultBackground,
      })
      .flatten({
        background: this.options.backgroundColorDark ?? darkDefaultBackground,
      })
      .resize(darkSplash.width, darkSplash.height, {
        fit: sharp.fit.outside,
        position: sharp.gravity.center,
        background: this.options.backgroundColorDark ?? darkDefaultBackground,
      })
      .png()
      .toFile(darkDest);

    const darkSplashOutput = new OutputAsset(
      darkSplash,
      asset,
      project,
      {
        [darkDest]: darkDest,
      },
      {
        [darkDest]: darkOutputInfo,
      },
    );

    generated.push(darkSplashOutput);

    await this.updateContentsJsonDark(darkSplashOutput, project);

    return [...logos, ...generated];
  }

  private async _generateIcons(
    asset: InputAsset,
    project: Project,
    icons: IosOutputAssetTemplate[],
  ): Promise<OutputAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const iosDir = project.config.ios!.path!;
    return Promise.all(
      icons.map(async icon => {
        const dest = join(iosDir, IOS_APP_ICON_SET_PATH, icon.name);

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
  }

  private async generateIcons(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
    const icons = Object.values(IosAssetTemplates).filter(
      a => a.kind === AssetKind.Icon,
    );

    return this._generateIcons(
      asset,
      project,
      icons as IosOutputAssetTemplate[],
    );
  }

  private async generateNotificationIcons(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
    const icons = Object.values(IosAssetTemplates).filter(
      a => a.kind === AssetKind.NotificationIcon,
    );

    return this._generateIcons(
      asset,
      project,
      icons as IosOutputAssetTemplate[],
    );
  }

  private async generateSettingsIcons(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
    const icons = Object.values(IosAssetTemplates).filter(
      a => a.kind === AssetKind.SettingsIcon,
    );

    return this._generateIcons(
      asset,
      project,
      icons as IosOutputAssetTemplate[],
    );
  }

  private async generateSpotlightIcons(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]> {
    const icons = Object.values(IosAssetTemplates).filter(
      a => a.kind === AssetKind.SpotlightIcon,
    );

    return this._generateIcons(
      asset,
      project,
      icons as IosOutputAssetTemplate[],
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

    const assetMeta =
      asset.kind === AssetKind.Splash
        ? IOS_2X_UNIVERSAL_ANYANY_SPLASH
        : IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK;

    const iosDir = project.config.ios!.path!;
    const dest = join(iosDir, IOS_SPLASH_IMAGE_SET_PATH, assetMeta.name);

    const outputInfo = await pipe
      .resize(assetMeta.width, assetMeta.height)
      .png()
      .toFile(dest);

    const generated = new OutputAsset(
      assetMeta,
      asset,
      project,
      {
        [assetMeta.name]: dest,
      },
      {
        [assetMeta.name]: outputInfo,
      },
    );

    if (asset.kind === AssetKind.SplashDark) {
      // Need to register this as a dark-mode splash
      await this.updateContentsJsonDark(generated, project);
    }

    return [generated];
  }

  private async updateContentsJsonDark(
    generated: OutputAsset,
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
      scale: `${generated.template.scale ?? 1}x`,
      filename: (generated.template as IosOutputAssetTemplate).name,
    });

    parsed.images = withoutMissing;

    await writeFile(contentsJsonPath, JSON.stringify(parsed, null, 2));
  }
}
