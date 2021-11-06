import { Asset } from "./asset";

export interface Assets {
  icon: Asset | null;
  splash: Asset | null;
  splashDark: Asset | null;
};

export const enum AssetKind {
  Icon = 'icon',
  AdaptiveIcon = 'adaptive-icon',
  Splash = 'splash',
  SplashDark = 'splash-dark'
};

export const enum Platform {
  Ios = 'ios',
  Android = 'android',
  Pwa = 'pwa',
  // Windows = 'windows'
};

export const enum Format {
  Png = 'png',
  Jpeg = 'jpeg',
  Svg = 'svg',
  WebP = 'webp',
  Unknown = 'unknown'
}

export const enum Orientation {
  Portrait = 'portrait',
  Landscape = 'landscape'
}

export const enum Theme {
  Any = 'any',
  Light = 'light',
  Dark = 'dark'
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
  }
}