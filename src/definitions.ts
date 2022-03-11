import { Asset } from './asset';

export interface Assets {
  icon: Asset | null;
  splash: Asset | null;
  splashDark: Asset | null;

  iosIcon?: Asset | null;
  iosSplash?: Asset | null;
  iosSplashDark?: Asset | null;
  iosNotificationIcon?: Asset | null;
  iosSettingsIcon?: Asset | null;
  iosSpotlightIcon?: Asset | null;

  androidIcon?: Asset | null;
  androidSplash?: Asset | null;
  androidSplashDark?: Asset | null;
  androidNotificationIcon?: Asset | null;

  pwaIcon?: Asset | null;
  pwaSplash?: Asset | null;
  pwaSplashDark?: Asset | null;
}

export const enum AssetKind {
  Icon = 'icon',
  NotificationIcon = 'notification-icon',
  SettingsIcon = 'settings-icon',
  SpotlightIcon = 'spotlight-icon',
  AdaptiveIcon = 'adaptive-icon',
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

export interface AssetMeta {
  platform: Platform;
  kind: AssetKind;
  // The filename (no path) for the asset
  name: string;
  // The destination file
  dest?: string;
  format: Format;
  width: number;
  height: number;
  orientation?: Orientation;
  scale?: number;
  theme?: Theme;
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
