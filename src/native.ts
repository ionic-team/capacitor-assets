import { copy } from '@ionic/utils-fs';
import Debug from 'debug';
import path from 'path';
import util from 'util';

import { Platform, prettyPlatform } from './platform';
import {
  ANDROID_MDPI_ICON,
  ANDROID_HDPI_ICON,
  ANDROID_XHDPI_ICON,
  ANDROID_XXHDPI_ICON,
  ANDROID_XXXHDPI_ICON,
  ANDROID_MDPI_ADAPTIVE_ICON,
  ANDROID_HDPI_ADAPTIVE_ICON,
  ANDROID_XHDPI_ADAPTIVE_ICON,
  ANDROID_XXHDPI_ADAPTIVE_ICON,
  ANDROID_XXXHDPI_ADAPTIVE_ICON,
  ANDROID_LAND_MDPI_SCREEN,
  ANDROID_LAND_HDPI_SCREEN,
  ANDROID_LAND_XHDPI_SCREEN,
  ANDROID_LAND_XXHDPI_SCREEN,
  ANDROID_LAND_XXXHDPI_SCREEN,
  ANDROID_PORT_MDPI_SCREEN,
  ANDROID_PORT_HDPI_SCREEN,
  ANDROID_PORT_XHDPI_SCREEN,
  ANDROID_PORT_XXHDPI_SCREEN,
  ANDROID_PORT_XXXHDPI_SCREEN,
  IOS_20_PT_ICON,
  IOS_20_PT_2X_ICON,
  IOS_20_PT_3X_ICON,
  IOS_29_PT_ICON,
  IOS_29_PT_2X_ICON,
  IOS_29_PT_3X_ICON,
  IOS_40_PT_ICON,
  IOS_40_PT_2X_ICON,
  IOS_40_PT_3X_ICON,
  IOS_60_PT_2X_ICON,
  IOS_60_PT_3X_ICON,
  IOS_76_PT_ICON,
  IOS_76_PT_2X_ICON,
  IOS_83_5_PT_2X_ICON,
  IOS_1024_ICON,
  IOS_2X_UNIVERSAL_ANYANY_SPLASH,
} from './resources';

export interface NativeProjectConfig {
  readonly directory: string;
}

export const enum NativeResourceType {
  IOS_ICON = 'ios-icon',
  IOS_SPLASH = 'ios-splash',
  ANDROID_ADAPTIVE_FOREGROUND = 'android-adaptive-foreground',
  ANDROID_ADAPTIVE_BACKGROUND = 'android-adaptive-background',
  ANDROID_ROUND = 'android-round',
  ANDROID_LEGACY = 'android-legacy',
  ANDROID_SPLASH = 'android-splash',
}

export interface NativeResource {
  readonly type: NativeResourceType;
  readonly source: string;
  readonly target: string;
}

const debug = Debug('cordova-res:native');

const SOURCE_IOS_ICON = 'ios/icon';
const SOURCE_IOS_SPLASH = 'ios/splash';
const SOURCE_ANDROID_ICON = 'android/icon';
const SOURCE_ANDROID_SPLASH = 'android/splash';

const IOS_APP_ICON_SET_NAME = 'AppIcon';
const IOS_APP_ICON_SET_PATH = `App/App/Assets.xcassets/${IOS_APP_ICON_SET_NAME}.appiconset`;
const IOS_SPLASH_IMAGE_SET_NAME = 'Splash';
const IOS_SPLASH_IMAGE_SET_PATH = `App/App/Assets.xcassets/${IOS_SPLASH_IMAGE_SET_NAME}.imageset`;

const ANDROID_RES_PATH = 'app/src/main/res';

const IOS_ICONS: readonly NativeResource[] = [
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_20_PT_ICON.src,
    target: 'AppIcon-20x20@1x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_20_PT_2X_ICON.src,
    target: 'AppIcon-20x20@2x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_20_PT_2X_ICON.src,
    target: 'AppIcon-20x20@2x-1.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_20_PT_3X_ICON.src,
    target: 'AppIcon-20x20@3x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_29_PT_ICON.src,
    target: 'AppIcon-29x29@1x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_29_PT_2X_ICON.src,
    target: 'AppIcon-29x29@2x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_29_PT_2X_ICON.src,
    target: 'AppIcon-29x29@2x-1.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_29_PT_3X_ICON.src,
    target: 'AppIcon-29x29@3x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_40_PT_ICON.src,
    target: 'AppIcon-40x40@1x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_40_PT_2X_ICON.src,
    target: 'AppIcon-40x40@2x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_40_PT_2X_ICON.src,
    target: 'AppIcon-40x40@2x-1.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_40_PT_3X_ICON.src,
    target: 'AppIcon-40x40@3x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_60_PT_2X_ICON.src,
    target: 'AppIcon-60x60@2x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_60_PT_3X_ICON.src,
    target: 'AppIcon-60x60@3x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_76_PT_ICON.src,
    target: 'AppIcon-76x76@1x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_76_PT_2X_ICON.src,
    target: 'AppIcon-76x76@2x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_83_5_PT_2X_ICON.src,
    target: 'AppIcon-83.5x83.5@2x.png',
  },
  {
    type: NativeResourceType.IOS_ICON,
    source: IOS_1024_ICON.src,
    target: 'AppIcon-512@2x.png',
  },
];

const IOS_SPLASHES: readonly NativeResource[] = [
  {
    type: NativeResourceType.IOS_SPLASH,
    source: IOS_2X_UNIVERSAL_ANYANY_SPLASH.src,
    target: 'splash-2732x2732.png',
  },
  {
    type: NativeResourceType.IOS_SPLASH,
    source: IOS_2X_UNIVERSAL_ANYANY_SPLASH.src,
    target: 'splash-2732x2732-1.png',
  },
  {
    type: NativeResourceType.IOS_SPLASH,
    source: IOS_2X_UNIVERSAL_ANYANY_SPLASH.src,
    target: 'splash-2732x2732-2.png',
  },
];

const ANDROID_ICONS: readonly NativeResource[] = [
  {
    type: NativeResourceType.ANDROID_LEGACY,
    source: ANDROID_MDPI_ICON.src,
    target: 'mipmap-mdpi/ic_launcher.png',
  },
  {
    type: NativeResourceType.ANDROID_ROUND,
    source: ANDROID_MDPI_ICON.src,
    target: 'mipmap-mdpi/ic_launcher_round.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_FOREGROUND,
    source: ANDROID_MDPI_ADAPTIVE_ICON.foreground,
    target: 'mipmap-mdpi/ic_launcher_foreground.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_BACKGROUND,
    source: ANDROID_MDPI_ADAPTIVE_ICON.background,
    target: 'mipmap-mdpi/ic_launcher_background.png',
  },
  {
    type: NativeResourceType.ANDROID_LEGACY,
    source: ANDROID_HDPI_ICON.src,
    target: 'mipmap-hdpi/ic_launcher.png',
  },
  {
    type: NativeResourceType.ANDROID_ROUND,
    source: ANDROID_HDPI_ICON.src,
    target: 'mipmap-hdpi/ic_launcher_round.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_FOREGROUND,
    source: ANDROID_HDPI_ADAPTIVE_ICON.foreground,
    target: 'mipmap-hdpi/ic_launcher_foreground.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_BACKGROUND,
    source: ANDROID_HDPI_ADAPTIVE_ICON.background,
    target: 'mipmap-hdpi/ic_launcher_background.png',
  },
  {
    type: NativeResourceType.ANDROID_LEGACY,
    source: ANDROID_XHDPI_ICON.src,
    target: 'mipmap-xhdpi/ic_launcher.png',
  },
  {
    type: NativeResourceType.ANDROID_ROUND,
    source: ANDROID_XHDPI_ICON.src,
    target: 'mipmap-xhdpi/ic_launcher_round.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_FOREGROUND,
    source: ANDROID_XHDPI_ADAPTIVE_ICON.foreground,
    target: 'mipmap-xhdpi/ic_launcher_foreground.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_BACKGROUND,
    source: ANDROID_XHDPI_ADAPTIVE_ICON.background,
    target: 'mipmap-xhdpi/ic_launcher_background.png',
  },
  {
    type: NativeResourceType.ANDROID_LEGACY,
    source: ANDROID_XXHDPI_ICON.src,
    target: 'mipmap-xxhdpi/ic_launcher.png',
  },
  {
    type: NativeResourceType.ANDROID_ROUND,
    source: ANDROID_XXHDPI_ICON.src,
    target: 'mipmap-xxhdpi/ic_launcher_round.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_FOREGROUND,
    source: ANDROID_XXHDPI_ADAPTIVE_ICON.foreground,
    target: 'mipmap-xxhdpi/ic_launcher_foreground.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_BACKGROUND,
    source: ANDROID_XXHDPI_ADAPTIVE_ICON.background,
    target: 'mipmap-xxhdpi/ic_launcher_background.png',
  },
  {
    type: NativeResourceType.ANDROID_LEGACY,
    source: ANDROID_XXXHDPI_ICON.src,
    target: 'mipmap-xxxhdpi/ic_launcher.png',
  },
  {
    type: NativeResourceType.ANDROID_ROUND,
    source: ANDROID_XXXHDPI_ICON.src,
    target: 'mipmap-xxxhdpi/ic_launcher_round.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_FOREGROUND,
    source: ANDROID_XXXHDPI_ADAPTIVE_ICON.foreground,
    target: 'mipmap-xxxhdpi/ic_launcher_foreground.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_BACKGROUND,
    source: ANDROID_XXXHDPI_ADAPTIVE_ICON.background,
    target: 'mipmap-xxxhdpi/ic_launcher_background.png',
  },
];

const ANDROID_SPLASHES: readonly NativeResource[] = [
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_MDPI_SCREEN.src,
    target: 'drawable/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_MDPI_SCREEN.src,
    target: 'drawable-land-mdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_HDPI_SCREEN.src,
    target: 'drawable-land-hdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_XHDPI_SCREEN.src,
    target: 'drawable-land-xhdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_XXHDPI_SCREEN.src,
    target: 'drawable-land-xxhdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_XXXHDPI_SCREEN.src,
    target: 'drawable-land-xxxhdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_PORT_MDPI_SCREEN.src,
    target: 'drawable-port-mdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_PORT_HDPI_SCREEN.src,
    target: 'drawable-port-hdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_PORT_XHDPI_SCREEN.src,
    target: 'drawable-port-xhdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_PORT_XXHDPI_SCREEN.src,
    target: 'drawable-port-xxhdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_PORT_XXXHDPI_SCREEN.src,
    target: 'drawable-port-xxxhdpi/splash.png',
  },
];

async function copyImages(
  sourcePath: string,
  targetPath: string,
  images: readonly NativeResource[],
  errstream: NodeJS.WritableStream | null,
): Promise<number> {
  await Promise.all(
    images.map(async item => {
      const source = path.join(sourcePath, item.source);
      const target = path.join(targetPath, item.target);

      debug('Copying generated resource from %O to %O', source, target);

      try {
        await copy(source, target);
      } catch (e) {
        debug(e);
        errstream?.write(`WARN:\tError occurred while copying ${source}\n`);
      }
    }),
  );

  return images.length;
}

export async function copyToNativeProject(
  platform: Platform,
  resourcesDirectory: string,
  nativeProject: NativeProjectConfig,
  shouldCopyIcons: boolean,
  shouldCopySplash: boolean,
  logstream: NodeJS.WritableStream | null,
  errstream: NodeJS.WritableStream | null,
): Promise<void> {
  let count = 0;

  if (platform === Platform.IOS) {
    const iosProjectDirectory = nativeProject.directory || 'ios';
    if (shouldCopyIcons) {
      count += await copyImages(
        path.join(resourcesDirectory, SOURCE_IOS_ICON),
        path.join(iosProjectDirectory, IOS_APP_ICON_SET_PATH),
        IOS_ICONS,
        errstream,
      );
    }
    if (shouldCopySplash) {
      count += await copyImages(
        path.join(resourcesDirectory, SOURCE_IOS_SPLASH),
        path.join(iosProjectDirectory, IOS_SPLASH_IMAGE_SET_PATH),
        IOS_SPLASHES,
        errstream,
      );
    }
  } else if (platform === Platform.ANDROID) {
    const androidProjectDirectory = nativeProject.directory || 'android';
    if (shouldCopyIcons) {
      count += await copyImages(
        path.join(resourcesDirectory, SOURCE_ANDROID_ICON),
        path.join(androidProjectDirectory, ANDROID_RES_PATH),
        ANDROID_ICONS,
        errstream,
      );
    }
    if (shouldCopySplash) {
      count += await copyImages(
        path.join(resourcesDirectory, SOURCE_ANDROID_SPLASH),
        path.join(androidProjectDirectory, ANDROID_RES_PATH),
        ANDROID_SPLASHES,
        errstream,
      );
    }
  } else {
    errstream?.write(
      util.format(
        'WARN:\tCopying to native projects is not supported for the %s platform',
        prettyPlatform(platform),
      ) + '\n',
    );
    return;
  }

  logstream?.write(
    util.format(
      `Copied %s resource items to %s`,
      count,
      prettyPlatform(platform),
    ) + '\n',
  );
}
