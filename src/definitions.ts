import { InputAsset } from './input-asset';

export interface Assets {
  logo: InputAsset | null;
  logoDark: InputAsset | null;
  icon: InputAsset | null;
  iconForeground: InputAsset | null;
  iconBackground: InputAsset | null;
  splash: InputAsset | null;
  splashDark: InputAsset | null;

  iosIcon?: InputAsset | null;
  iosSplash?: InputAsset | null;
  iosSplashDark?: InputAsset | null;
  iosNotificationIcon?: InputAsset | null;
  iosSettingsIcon?: InputAsset | null;
  iosSpotlightIcon?: InputAsset | null;

  androidIcon?: InputAsset | null;
  androidIconForeground?: InputAsset | null;
  androidIconBackground?: InputAsset | null;

  androidSplash?: InputAsset | null;
  androidSplashDark?: InputAsset | null;
  androidNotificationIcon?: InputAsset | null;

  pwaIcon?: InputAsset | null;
  pwaSplash?: InputAsset | null;
  pwaSplashDark?: InputAsset | null;
}

export const enum AssetKind {
  Logo = 'logo',
  LogoDark = 'logo-dark',
  Icon = 'icon',
  IconForeground = 'icon-foreground',
  IconBackground = 'icon-background',
  NotificationIcon = 'notification-icon',
  SettingsIcon = 'settings-icon',
  SpotlightIcon = 'spotlight-icon',
  Splash = 'splash',
  SplashDark = 'splash-dark',
}

export const enum Platform {
  Ios = 'ios',
  Android = 'android',
  Pwa = 'pwa',
  // Windows = 'windows'
}

export const enum Format {
  Png = 'png',
  Jpeg = 'jpeg',
  Svg = 'svg',
  WebP = 'webp',
  Unknown = 'unknown',
}

export const enum Orientation {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

export const enum Theme {
  Any = 'any',
  Light = 'light',
  Dark = 'dark',
}

export const enum AndroidDensity {
  Ldpi = 'ldpi',
  Mdpi = 'mdpi',
  Hdpi = 'hdpi',
  Xhdpi = 'xhdpi',
  Xxhdpi = 'xxhdpi',
  Xxxhdpi = 'xxxhdpi',
  LandLdpi = 'land-ldpi',
  LandMdpi = 'land-mdpi',
  LandHdpi = 'land-hdpi',
  LandXhdpi = 'land-xhdpi',
  LandXxhdpi = 'land-xxhdpi',
  LandXxxhdpi = 'land-xxxhdpi',
  PortLdpi = 'port-ldpi',
  PortMdpi = 'port-mdpi',
  PortHdpi = 'port-hdpi',
  PortXhdpi = 'port-xhdpi',
  PortXxhdpi = 'port-xxhdpi',
  PortXxxhdpi = 'port-xxxhdpi',
}

export interface OutputAssetTemplate {
  platform: Platform;
  kind: AssetKind;
  format: Format;
  width: number;
  height: number;
  scale?: number;
}

export interface IosOutputAssetTemplate extends OutputAssetTemplate {
  name: string;
}
export interface IosOutputAssetTemplateIcon extends IosOutputAssetTemplate {}
export interface IosOutputAssetTemplateSplash extends IosOutputAssetTemplate {
  orientation: Orientation;
  theme: Theme;
}
export interface PwaOutputAssetTemplate extends OutputAssetTemplate {
  name: string;
}

export interface AndroidOutputAssetTemplate extends OutputAssetTemplate {
  density: AndroidDensity;
}
export interface AndroidOutputAssetTemplateSplash extends OutputAssetTemplate {
  density: AndroidDensity;
  orientation: Orientation;
  theme: Theme;
}
export interface AndroidOutputAssetTemplateAdaptiveIcon
  extends OutputAssetTemplate {
  density: AndroidDensity;
}

// Shape of the Contents.json file inside of ios app appiconset and imageset folders
export interface IosContents {
  images: {
    filename: string;
    size: string;
    scale: string;
    idiom: string;
  }[];
  info?: {
    version: number;
    author: string;
  };
}
