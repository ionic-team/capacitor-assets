import { readFile, rmSync, writeFile } from '@ionic/utils-fs';
import { join } from 'path';
import sharp from 'sharp';

import type { AssetGeneratorOptions } from '../../asset-generator';
import { AssetGenerator } from '../../asset-generator';
import type { IosOutputAssetTemplate } from '../../definitions';
import { AssetKind, IosIconAppearance, Platform } from '../../definitions';
import { BadPipelineError, BadProjectError } from '../../error';
import type { InputAsset } from '../../input-asset';
import { OutputAsset } from '../../output-asset';
import type { Project } from '../../project';

import {
  IOS_1X_UNIVERSAL_ANYANY_SPLASH,
  IOS_2X_UNIVERSAL_ANYANY_SPLASH,
  IOS_3X_UNIVERSAL_ANYANY_SPLASH,
  IOS_1X_UNIVERSAL_ANYANY_SPLASH_DARK,
  IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK,
  IOS_3X_UNIVERSAL_ANYANY_SPLASH_DARK,
} from './assets';
import * as IosAssetTemplates from './assets';

export const IOS_APP_ICON_SET_NAME = 'AppIcon';
export const IOS_APP_ICON_SET_PATH = `App/Assets.xcassets/${IOS_APP_ICON_SET_NAME}.appiconset`;
export const IOS_SPLASH_IMAGE_SET_NAME = 'Splash';
export const IOS_SPLASH_IMAGE_SET_PATH = `App/Assets.xcassets/${IOS_SPLASH_IMAGE_SET_NAME}.imageset`;

export class IosAssetGenerator extends AssetGenerator {
  constructor(options: AssetGeneratorOptions = {}) {
    super(options);
  }

  async generate(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const iosDir = project.config.ios?.path;

    if (!iosDir) {
      throw new BadProjectError('No ios project found');
    }

    if (asset.platform !== Platform.Any && asset.platform !== Platform.Ios) {
      return [];
    }

    switch (asset.kind) {
      case AssetKind.Logo:
      case AssetKind.LogoDark:
        return this.generateFromLogo(asset, project);
      case AssetKind.Icon:
        return this.generateIcons(asset, project);
      case AssetKind.IconDark:
        return this._generateIcons(asset, project, [IosAssetTemplates.IOS_1024_ICON_DARK]);
      case AssetKind.IconTinted:
        return this._generateIcons(asset, project, [IosAssetTemplates.IOS_1024_ICON_TINTED]);
      case AssetKind.Splash:
      case AssetKind.SplashDark:
        return this.generateSplashes(asset, project);
    }

    return [];
  }

  /**
   * The icon templates to generate from a primary (light) icon source.
   * Dark/tinted variants are auto-derived unless the project provides
   * explicit ios/icon-dark or ios/icon-tinted sources, which are then
   * generated in their own pass.
   */
  private iconTemplates(project: Project): IosOutputAssetTemplate[] {
    const icons = Object.values(IosAssetTemplates).filter((a) => a.kind === AssetKind.Icon) as IosOutputAssetTemplate[];

    return icons.filter((icon) => {
      if (icon.appearance === IosIconAppearance.Dark && project.assets?.iosIconDark) {
        return false;
      }
      if (icon.appearance === IosIconAppearance.Tinted && project.assets?.iosIconTinted) {
        return false;
      }
      return true;
    });
  }

  private async generateFromLogo(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const iosDir = project.config.ios?.path ?? 'App';

    // Generate logos
    let logos: OutputAsset[] = [];
    if (asset.kind === AssetKind.Logo) {
      logos = await this.generateIconsForLogo(asset, project);
    }

    const generated: OutputAsset[] = [];

    const targetLogoWidthPercent = this.options.logoSplashScale ?? 0.2;
    const targetWidth = this.options.logoSplashTargetWidth ?? Math.floor((asset.width ?? 0) * targetLogoWidthPercent);

    if (asset.kind === AssetKind.Logo) {
      // Generate light splash
      const lightDefaultBackground = '#ffffff';
      const lightSplashes = [
        IOS_1X_UNIVERSAL_ANYANY_SPLASH,
        IOS_2X_UNIVERSAL_ANYANY_SPLASH,
        IOS_3X_UNIVERSAL_ANYANY_SPLASH,
      ];
      const lightSplashesGenerated: OutputAsset[] = [];

      for (const lightSplash of lightSplashes) {
        const lightDest = join(iosDir, IOS_SPLASH_IMAGE_SET_PATH, lightSplash.name);

        const canvas = sharp({
          create: {
            width: lightSplash.width ?? 0,
            height: lightSplash.height ?? 0,
            channels: 4,
            background: this.options.splashBackgroundColor ?? lightDefaultBackground,
          },
        });
        const resized = await sharp(asset.path).resize(targetWidth).toBuffer();
        const lightOutputInfo = await canvas
          .composite([{ input: resized, gravity: sharp.gravity.center }])
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
        lightSplashesGenerated.push(lightSplashOutput);
      }

      await this.updateSplashContentsJson(lightSplashesGenerated, project);
    }

    // Generate dark splash
    const darkDefaultBackground = '#111111';
    const darkSplashes = [
      IOS_1X_UNIVERSAL_ANYANY_SPLASH_DARK,
      IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK,
      IOS_3X_UNIVERSAL_ANYANY_SPLASH_DARK,
    ];
    const darkSplashesGenerated: OutputAsset[] = [];

    for (const darkSplash of darkSplashes) {
      const darkDest = join(iosDir, IOS_SPLASH_IMAGE_SET_PATH, darkSplash.name);
      const canvas = sharp({
        create: {
          width: darkSplash.width ?? 0,
          height: darkSplash.height ?? 0,
          channels: 4,
          background: this.options.splashBackgroundColorDark ?? darkDefaultBackground,
        },
      });
      const resized = await sharp(asset.path).resize(targetWidth).toBuffer();
      const darkOutputInfo = await canvas
        .composite([{ input: resized, gravity: sharp.gravity.center }])
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
      darkSplashesGenerated.push(darkSplashOutput);
    }

    await this.updateSplashContentsJsonDark(darkSplashesGenerated, project);

    return [...logos, ...generated];
  }

  private async _generateIcons(
    asset: InputAsset,
    project: Project,
    icons: IosOutputAssetTemplate[],
  ): Promise<OutputAsset[]> {
    if (!asset.pipeline()) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const iosDir = project.config.ios?.path ?? 'App';
    const lightDefaultBackground = '#ffffff';
    // True when the source is an explicit ios/icon-dark or ios/icon-tinted
    // file, in which case the user's art is used as-is (no derivation).
    const explicitVariant = asset.kind === AssetKind.IconDark || asset.kind === AssetKind.IconTinted;

    const generated = await Promise.all(
      icons.map(async (icon) => {
        const dest = join(iosDir, IOS_APP_ICON_SET_PATH, icon.name);
        const appearance = icon.appearance ?? IosIconAppearance.Any;

        // When deriving the dark variant while generating from a logo,
        // prefer the dark logo if one was provided.
        let sourcePath = asset.path;
        if (appearance === IosIconAppearance.Dark && asset.kind === AssetKind.Logo && project.assets?.logoDark) {
          sourcePath = project.assets.logoDark.path;
        }

        const pipe = sharp(sourcePath).resize(icon.width, icon.height);

        if (appearance === IosIconAppearance.Dark) {
          // Dark icons keep their transparency so the system-provided
          // dark background shows through.
        } else if (appearance === IosIconAppearance.Tinted) {
          // Tinted icons must be fully opaque grayscale.
          pipe.flatten({ background: this.options.iconBackgroundColor ?? lightDefaultBackground });
          if (!explicitVariant) {
            pipe.greyscale();
          }
        } else {
          pipe.flatten({ background: this.options.iconBackgroundColor ?? lightDefaultBackground });
        }

        const outputInfo = await pipe.png().toFile(dest);

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

    await this.updateIconsContentsJson(generated, project);

    return generated;
  }

  // Generate ALL the icons when only given a logo
  private async generateIconsForLogo(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    return this._generateIcons(asset, project, this.iconTemplates(project));
  }

  private async generateIcons(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    return this._generateIcons(asset, project, this.iconTemplates(project));
  }

  private async generateSplashes(asset: InputAsset, project: Project): Promise<OutputAsset[]> {
    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const assetMetas =
      asset.kind === AssetKind.Splash
        ? [IOS_1X_UNIVERSAL_ANYANY_SPLASH, IOS_2X_UNIVERSAL_ANYANY_SPLASH, IOS_3X_UNIVERSAL_ANYANY_SPLASH]
        : [
            IOS_1X_UNIVERSAL_ANYANY_SPLASH_DARK,
            IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK,
            IOS_3X_UNIVERSAL_ANYANY_SPLASH_DARK,
          ];

    const generated: OutputAsset[] = [];

    for (const assetMeta of assetMetas) {
      const iosDir = project.config.ios?.path ?? 'App';
      const dest = join(iosDir, IOS_SPLASH_IMAGE_SET_PATH, assetMeta.name);

      const outputInfo = await pipe.resize(assetMeta.width, assetMeta.height).png().toFile(dest);

      const g = new OutputAsset(
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

      generated.push(g);
    }

    if (asset.kind === AssetKind.Splash) {
      await this.updateSplashContentsJson(generated, project);
    } else if (asset.kind === AssetKind.SplashDark) {
      // Need to register this as a dark-mode splash
      await this.updateSplashContentsJsonDark(generated, project);
    }

    return generated;
  }

  private async updateIconsContentsJson(generated: OutputAsset[], project: Project) {
    const assetsPath = join(project.config.ios?.path ?? 'App', IOS_APP_ICON_SET_PATH);
    const contentsJsonPath = join(assetsPath, 'Contents.json');
    const json = await readFile(contentsJsonPath, { encoding: 'utf-8' });

    const parsed = JSON.parse(json);

    // The luminosity appearance of a Contents.json image entry ('any' when absent)
    const appearanceOf = (entry: any): string =>
      entry?.appearances?.find((a: any) => a.appearance === 'luminosity')?.value ?? IosIconAppearance.Any;

    let images: any[] = (parsed.images ?? []).filter((i: any) => !!i.filename);

    for (const g of generated) {
      const template = g.template as IosOutputAssetTemplate;
      const appearance = template.appearance ?? IosIconAppearance.Any;

      // Replace any existing entries for this appearance, removing files
      // they referenced (e.g. legacy multi-size icons from older projects)
      for (const existing of images.filter((i) => appearanceOf(i) === appearance)) {
        if (existing.filename !== template.name) {
          rmSync(join(assetsPath, existing.filename), { force: true });
        }
      }
      images = images.filter((i) => appearanceOf(i) !== appearance);

      const entry: any = {
        idiom: template.idiom,
        size: `${template.width}x${template.height}`,
        filename: template.name,
        platform: Platform.Ios,
      };
      if (appearance !== IosIconAppearance.Any) {
        entry.appearances = [{ appearance: 'luminosity', value: appearance }];
      }
      images.push(entry);
    }

    parsed.images = images;

    await writeFile(contentsJsonPath, JSON.stringify(parsed, null, 2));
  }

  private async updateSplashContentsJson(generated: OutputAsset[], project: Project) {
    const contentsJsonPath = join(project.config.ios?.path ?? 'App', IOS_SPLASH_IMAGE_SET_PATH, 'Contents.json');
    const json = await readFile(contentsJsonPath, { encoding: 'utf-8' });

    const parsed = JSON.parse(json);

    const withoutMissing = parsed.images.filter((i: any) => !!i.filename);

    for (const g of generated) {
      const existing = withoutMissing.find(
        (f: any) =>
          f.scale === `${g.template.scale}x` && f.idiom === 'universal' && typeof f.appearances === 'undefined',
      );

      if (existing) {
        existing.filename = (g.template as IosOutputAssetTemplate).name;
      } else {
        withoutMissing.push({
          idiom: 'universal',
          scale: `${g.template.scale ?? 1}x`,
          filename: (g.template as IosOutputAssetTemplate).name,
        });
      }
    }

    parsed.images = withoutMissing;

    await writeFile(contentsJsonPath, JSON.stringify(parsed, null, 2));
  }

  private async updateSplashContentsJsonDark(generated: OutputAsset[], project: Project) {
    const contentsJsonPath = join(project.config.ios?.path ?? 'App', IOS_SPLASH_IMAGE_SET_PATH, 'Contents.json');
    const json = await readFile(contentsJsonPath, { encoding: 'utf-8' });

    const parsed = JSON.parse(json);

    const withoutMissing = parsed.images.filter((i: any) => !!i.filename);

    for (const g of generated) {
      const existing = withoutMissing.find(
        (f: any) =>
          f.scale === `${g.template.scale}x` && f.idiom === 'universal' && typeof f.appearances !== 'undefined',
      );

      if (existing) {
        existing.filename = (g.template as IosOutputAssetTemplate).name;
      } else {
        withoutMissing.push({
          appearances: [
            {
              appearance: 'luminosity',
              value: 'dark',
            },
          ],
          idiom: 'universal',
          scale: `${g.template.scale ?? 1}x`,
          filename: (g.template as IosOutputAssetTemplate).name,
        });
      }
    }

    parsed.images = withoutMissing;

    await writeFile(contentsJsonPath, JSON.stringify(parsed, null, 2));
  }
}
