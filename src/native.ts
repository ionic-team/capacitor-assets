import fs from 'fs';

import { BadInputError } from './error';
import { Platform } from './platform';

interface Icon {
  source: string;
  target: string;
}

const SOURCE_IOS_ICON = 'resources/ios/icon/';
const SOURCE_IOS_SPLASH = 'resources/ios/splash/';

const TARGET_IOS_ICON = '/App/App/Assets.xcassets/AppIcon.appiconset/';
const TARGET_IOS_SPLASH = '/App/App/Assets.xcassets/Splash.imageset/';

const SOURCE_ANDROID_ICON = 'resources/android/icon/';
const SOURCE_ANDROID_SPLASH = 'resources/android/splash/';

const TARGET_ANDROID_ICON = '/app/src/main/res/';
const TARGET_ANDROID_SPLASH = '/app/src/main/res/';

const IOS_ICONS = [
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
const IOS_SPLASHES = [
  { source: 'Default-Portrait@~ipadpro.png', target: 'splash-2732x2732.png' },
  { source: 'Default-Portrait@~ipadpro.png', target: 'splash-2732x2732-1.png' },
  { source: 'Default-Portrait@~ipadpro.png', target: 'splash-2732x2732-2.png' },
];

const ANDROID_ICONS = [
  { source: 'drawable-ldpi-icon.png', target: 'drawable-hdpi-icon.png' },
  { source: 'drawable-mdpi-icon.png', target: 'mipmap-mdpi/ic_launcher.png' },
  {
    source: 'drawable-mdpi-icon.png',
    target: 'mipmap-mdpi/ic_launcher_round.png',
  },
  {
    source: 'drawable-mdpi-icon.png',
    target: 'mipmap-mdpi/ic_launcher_foreground.png',
  },
  { source: 'drawable-hdpi-icon.png', target: 'mipmap-hdpi/ic_launcher.png' },
  {
    source: 'drawable-hdpi-icon.png',
    target: 'mipmap-hdpi/ic_launcher_round.png',
  },
  {
    source: 'drawable-hdpi-icon.png',
    target: 'mipmap-hdpi/ic_launcher_foreground.png',
  },
  { source: 'drawable-xhdpi-icon.png', target: 'mipmap-xhdpi/ic_launcher.png' },
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
const ANDROID_SPLASHES = [
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

function copyImages(sourcePath: string, targetPath: string, images: Icon[]) {
  for (const icon of images) {
    const source = sourcePath + icon.source;
    const target = targetPath + icon.target;
    fs.copyFile(source, target, err => {
      if (err) {
        throw err;
      }
    });
  }
}

export function copyToNativeProject(platform: Platform, nativeProjectDirectory: string) {
  if (nativeProjectDirectory === '') {
    throw new BadInputError('Native project directory must be specified.');
  }
  if (nativeProjectDirectory.slice(-1) === '/') {
    nativeProjectDirectory = nativeProjectDirectory.slice(0, nativeProjectDirectory.length - 1);
  }

  if (platform === Platform.IOS) {
    copyImages(SOURCE_IOS_ICON, `${nativeProjectDirectory}${TARGET_IOS_ICON}`, IOS_ICONS);
    copyImages(SOURCE_IOS_SPLASH, `${nativeProjectDirectory}${TARGET_IOS_SPLASH}`, IOS_SPLASHES);
  } else if (platform === Platform.ANDROID) {
    copyImages(SOURCE_ANDROID_ICON, `${nativeProjectDirectory}${TARGET_ANDROID_ICON}`, ANDROID_ICONS);
    copyImages(SOURCE_ANDROID_SPLASH, `${nativeProjectDirectory}${TARGET_ANDROID_SPLASH}`, ANDROID_SPLASHES);
  }
}
