import { copy } from '@ionic/utils-fs';
import Debug from 'debug';
import path from 'path';
import util from 'util';

import { Platform, prettyPlatform } from './platform';

export interface NativeProjectConfig {
  directory: string;
}

interface ProcessItem {
  source: string;
  target: string;
}

const debug = Debug('cordova-res:native');

const SOURCE_IOS_ICON = 'resources/ios/icon/';
const SOURCE_IOS_SPLASH = 'resources/ios/splash/';

const TARGET_IOS_ICON = '/App/App/Assets.xcassets/AppIcon.appiconset/';
const TARGET_IOS_SPLASH = '/App/App/Assets.xcassets/Splash.imageset/';

const SOURCE_ANDROID_ICON = 'resources/android/icon/';
const SOURCE_ANDROID_SPLASH = 'resources/android/splash/';

const TARGET_ANDROID_ICON = '/app/src/main/res/';
const TARGET_ANDROID_SPLASH = '/app/src/main/res/';

// TODO: IOS_ICONS, IOS_SPLASHES, ANDROID_ICONS, and ANDROID_SPLASHES should
// probably be part of RESOURCES config.

const IOS_ICONS: readonly ProcessItem[] = [
  { source: 'icon-20.png', target: 'AppIcon-20x20@1x.png' },
  { source: 'icon-20@2x.png', target: 'AppIcon-20x20@2x.png' },
  { source: 'icon-20@2x.png', target: 'AppIcon-20x20@2x-1.png' },
  { source: 'icon-20@3x.png', target: 'AppIcon-20x20@3x.png' },
  { source: 'icon-29.png', target: 'AppIcon-29x29@1x.png' },
  { source: 'icon-29@2x.png', target: 'AppIcon-29x29@2x.png' },
  { source: 'icon-29@2x.png', target: 'AppIcon-29x29@2x-1.png' },
  { source: 'icon-29@3x.png', target: 'AppIcon-29x29@3x.png' },
  { source: 'icon-40.png', target: 'AppIcon-40x40@1x.png' },
  { source: 'icon-40@2x.png', target: 'AppIcon-40x40@2x.png' },
  { source: 'icon-40@2x.png', target: 'AppIcon-40x40@2x-1.png' },
  { source: 'icon-40@3x.png', target: 'AppIcon-40x40@3x.png' },
  { source: 'icon-60@2x.png', target: 'AppIcon-60x60@2x.png' },
  { source: 'icon-60@3x.png', target: 'AppIcon-60x60@3x.png' },
  { source: 'icon-76.png', target: 'AppIcon-76x76@1x.png' },
  { source: 'icon-76@2x.png', target: 'AppIcon-76x76@2x.png' },
  { source: 'icon-83.5@2x.png', target: 'AppIcon-83.5x83.5@2x.png' },
  { source: 'icon-1024.png', target: 'AppIcon-512@2x.png' },
];

const IOS_SPLASHES: readonly ProcessItem[] = [
  { source: 'Default-Portrait@~ipadpro.png', target: 'splash-2732x2732.png' },
  { source: 'Default-Portrait@~ipadpro.png', target: 'splash-2732x2732-1.png' },
  { source: 'Default-Portrait@~ipadpro.png', target: 'splash-2732x2732-2.png' },
];

const ANDROID_ICONS: readonly ProcessItem[] = [
  {
    source: 'drawable-ldpi-icon.png',
    target: 'drawable-hdpi-icon.png',
  },
  {
    source: 'drawable-mdpi-icon.png',
    target: 'mipmap-mdpi/ic_launcher.png',
  },
  {
    source: 'drawable-mdpi-icon.png',
    target: 'mipmap-mdpi/ic_launcher_round.png',
  },
  {
    source: 'drawable-mdpi-icon.png',
    target: 'mipmap-mdpi/ic_launcher_foreground.png',
  },
  {
    source: 'drawable-hdpi-icon.png',
    target: 'mipmap-hdpi/ic_launcher.png',
  },
  {
    source: 'drawable-hdpi-icon.png',
    target: 'mipmap-hdpi/ic_launcher_round.png',
  },
  {
    source: 'drawable-hdpi-icon.png',
    target: 'mipmap-hdpi/ic_launcher_foreground.png',
  },
  {
    source: 'drawable-xhdpi-icon.png',
    target: 'mipmap-xhdpi/ic_launcher.png',
  },
  {
    source: 'drawable-xhdpi-icon.png',
    target: 'mipmap-xhdpi/ic_launcher_round.png',
  },
  {
    source: 'drawable-xhdpi-icon.png',
    target: 'mipmap-xhdpi/ic_launcher_foreground.png',
  },
  {
    source: 'drawable-xxhdpi-icon.png',
    target: 'mipmap-xxhdpi/ic_launcher.png',
  },
  {
    source: 'drawable-xxhdpi-icon.png',
    target: 'mipmap-xxhdpi/ic_launcher_round.png',
  },
  {
    source: 'drawable-xxhdpi-icon.png',
    target: 'mipmap-xxhdpi/ic_launcher_foreground.png',
  },
  {
    source: 'drawable-xxxhdpi-icon.png',
    target: 'mipmap-xxxhdpi/ic_launcher.png',
  },
  {
    source: 'drawable-xxxhdpi-icon.png',
    target: 'mipmap-xxxhdpi/ic_launcher_round.png',
  },
  {
    source: 'drawable-xxxhdpi-icon.png',
    target: 'mipmap-xxxhdpi/ic_launcher_foreground.png',
  },
];

const ANDROID_SPLASHES: readonly ProcessItem[] = [
  { source: 'drawable-land-mdpi-screen.png', target: 'drawable/splash.png' },
  {
    source: 'drawable-land-mdpi-screen.png',
    target: 'drawable-land-mdpi/splash.png',
  },
  {
    source: 'drawable-land-hdpi-screen.png',
    target: 'drawable-land-hdpi/splash.png',
  },
  {
    source: 'drawable-land-xhdpi-screen.png',
    target: 'drawable-land-xhdpi/splash.png',
  },
  {
    source: 'drawable-land-xxhdpi-screen.png',
    target: 'drawable-land-xxhdpi/splash.png',
  },
  {
    source: 'drawable-land-xxxhdpi-screen.png',
    target: 'drawable-land-xxxhdpi/splash.png',
  },
  {
    source: 'drawable-port-mdpi-screen.png',
    target: 'drawable-port-mdpi/splash.png',
  },
  {
    source: 'drawable-port-hdpi-screen.png',
    target: 'drawable-port-hdpi/splash.png',
  },
  {
    source: 'drawable-port-xhdpi-screen.png',
    target: 'drawable-port-xhdpi/splash.png',
  },
  {
    source: 'drawable-port-xxhdpi-screen.png',
    target: 'drawable-port-xxhdpi/splash.png',
  },
  {
    source: 'drawable-port-xxxhdpi-screen.png',
    target: 'drawable-port-xxxhdpi/splash.png',
  },
];

async function copyImages(sourcePath: string, targetPath: string, images: readonly ProcessItem[]) {
  await Promise.all(images.map(async item => {
    const source = path.join(sourcePath, item.source);
    const target = path.join(targetPath, item.target);

    debug('Copying generated resource from %O to %O', source, target);

    await copy(source, target);
  }));
}

export async function copyToNativeProject(platform: Platform, nativeProject: NativeProjectConfig, logstream: NodeJS.WritableStream | null, errstream: NodeJS.WritableStream | null) {
  if (platform === Platform.IOS) {
    const iosProjectDirectory = nativeProject.directory || 'ios';
    await copyImages(SOURCE_IOS_ICON, path.join(iosProjectDirectory, TARGET_IOS_ICON), IOS_ICONS);
    await copyImages(SOURCE_IOS_SPLASH, path.join(iosProjectDirectory, TARGET_IOS_SPLASH), IOS_SPLASHES);
    logstream?.write(util.format(`Copied %s resource items to %s`, IOS_ICONS.length + IOS_SPLASHES.length, prettyPlatform(platform)) + '\n');
  } else if (platform === Platform.ANDROID) {
    const androidProjectDirectory = nativeProject.directory || 'android';
    await copyImages(SOURCE_ANDROID_ICON, path.join(androidProjectDirectory, TARGET_ANDROID_ICON), ANDROID_ICONS);
    await copyImages(SOURCE_ANDROID_SPLASH, path.join(androidProjectDirectory, TARGET_ANDROID_SPLASH), ANDROID_SPLASHES);
    logstream?.write(util.format(`Copied %s resource items to %s`, ANDROID_ICONS.length + ANDROID_SPLASHES.length, prettyPlatform(platform)) + '\n');
  } else {
    errstream?.write(util.format('WARN:\tCopying to native projects is not supported for %s', prettyPlatform(platform)) + '\n');
  }
}
