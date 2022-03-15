import { dirname, join } from 'path';
import { OutputInfo, Sharp } from 'sharp';
import { mkdirp, pathExists, writeFile } from '@ionic/utils-fs';

import { InputAsset } from '../../input-asset';
import { AssetGenerator } from '../../asset-generator';
import {
  AndroidOutputAssetTemplateAdaptiveIcon,
  AssetKind,
  OutputAssetTemplate,
} from '../../definitions';
import { BadPipelineError, BadProjectError } from '../../error';
import { OutputAsset } from '../../output-asset';
import { Project } from '../../project';

import * as AndroidAssetTemplates from './assets';

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
    ) as AndroidOutputAssetTemplateAdaptiveIcon[];

    const pipe = asset.pipeline();

    if (!pipe) {
      throw new BadPipelineError('Sharp instance not created');
    }

    const output = await Promise.all(
      icons.map(icon => this.generateAdaptiveIcon(icon, asset, project, pipe)),
    );

    await this.updateManifest(project, output);

    return output;
  }

  private async generateAdaptiveIcon(
    icon: AndroidOutputAssetTemplateAdaptiveIcon,
    asset: InputAsset,
    project: Project,
    pipe: Sharp,
  ) {
    const androidDir = project.config.android!.path!;

    const resPath = join(androidDir, 'app', 'src', 'main', 'res');

    // Create the foreground and background images
    const destForeground = join(
      resPath,
      `mipmap-${icon.density}`,
      'ic_launcher_foreground.png',
    );
    let parentDir = dirname(destForeground);
    if (!(await pathExists(parentDir))) {
      await mkdirp(parentDir);
    }
    const outputInfoForeground = await pipe
      .resize(icon.width, icon.height)
      .png()
      .toFile(destForeground);

    const destBackground = join(
      resPath,
      `mipmap-${icon.density}`,
      'ic_launcher_background.png',
    );
    parentDir = dirname(destBackground);
    if (!(await pathExists(parentDir))) {
      await mkdirp(parentDir);
    }
    const outputInfoBackground = await pipe
      .resize(icon.width, icon.height)
      .png()
      .toFile(destBackground);

    // Create the adaptive icon XML
    const icLauncherXml = `
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
    `.trim();

    const mipmapAnyPath = join(resPath, `mipmap-anydpi-v26`);
    if (!(await pathExists(mipmapAnyPath))) {
      await mkdirp(mipmapAnyPath);
    }
    const destIcLauncher = join(mipmapAnyPath, `ic_launcher.xml`);
    const destIcLauncherRound = join(mipmapAnyPath, `ic_launcher_round.xml`);
    await writeFile(destIcLauncher, icLauncherXml);
    await writeFile(destIcLauncherRound, icLauncherXml);

    // Make standard and rounded versions
    const [destLegacy, outputInfoLegacy] =
      await this.generateLegacyLauncherIcon(project, asset, icon, pipe);
    const [destRound, outputInfoRound] = await this.generateRoundLauncherIcon(
      project,
      asset,
      icon,
      pipe,
    );

    // Return the created files for this OutputAsset
    return new OutputAsset(
      icon,
      asset,
      project,
      {
        [`mipmap-${icon.density}/ic_launcher.png`]: destLegacy,
        [`mipmap-${icon.density}/ic_launcher_round.png`]: destRound,
        [`mipmap-${icon.density}/ic_launcher_foreground.png`]: destForeground,
        [`mipmap-${icon.density}/ic_launcher_background.png`]: destBackground,
        'mipmap-anydpi-v26/ic_launcher.xml': destIcLauncher,
        'mipmap-anydpi-v26/ic_launcher_round.xml': destIcLauncherRound,
      },
      {
        [`mipmap-${icon.density}/ic_launcher.png`]: outputInfoLegacy,
        [`mipmap-${icon.density}/ic_launcher_round.png`]: outputInfoRound,
        [`mipmap-${icon.density}/ic_launcher_foreground.png`]:
          outputInfoForeground,
        [`mipmap-${icon.density}/ic_launcher_background.png`]:
          outputInfoBackground,
      },
    );
  }

  private async generateLegacyLauncherIcon(
    project: Project,
    asset: InputAsset,
    template: OutputAssetTemplate,
    pipe: Sharp,
  ): Promise<[string, OutputInfo]> {
    // 8.33% found here: https://stackoverflow.com/a/35232500/32140
    const radius = template.width * 0.0833;
    const svg = `<svg width="${template.width}" height="${template.height}"><rect x="0" y="0" width="${template.width}" height="${template.height}" rx="${radius}" fill="#ffffff"/></svg>`;

    const androidDir = project.config.android!.path!;

    const resPath = join(androidDir, 'app', 'src', 'main', 'res');
    const destRound = join(
      resPath,
      `mipmap-${template.density}`,
      'ic_launcher.png',
    );

    const outputInfo = await pipe
      .resize(template.width, template.height)
      .composite([{ input: Buffer.from(svg), blend: 'dest-in' }])
      .png()
      .toFile(destRound);

    return [destRound, outputInfo];
  }

  private async generateRoundLauncherIcon(
    project: Project,
    asset: InputAsset,
    template: OutputAssetTemplate,
    pipe: Sharp,
  ): Promise<[string, OutputInfo]> {
    const svg = `<svg width="${template.width}" height="${
      template.height
    }"><circle cx="${template.width / 2}" cy="${template.height / 2}" r="${
      template.width / 2
    }" fill="#ffffff"/></svg>`;

    const androidDir = project.config.android!.path!;

    const resPath = join(androidDir, 'app', 'src', 'main', 'res');
    const destRound = join(
      resPath,
      `mipmap-${template.density}`,
      'ic_launcher_round.png',
    );

    const outputInfo = await pipe
      .resize(template.width, template.height)
      .composite([{ input: Buffer.from(svg), blend: 'dest-in' }])
      .png()
      .toFile(destRound);

    return [destRound, outputInfo];
  }

  private async updateManifest(project: Project, output: OutputAsset[]) {
    project.android?.getAndroidManifest()?.setAttrs('manifest/application', {
      'android:icon': '@mipmap/ic_launcher',
      'android:roundIcon': '@mipmap/ic_launcher_round',
    });

    await project.commit();
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
