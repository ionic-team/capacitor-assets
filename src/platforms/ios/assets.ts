import type { IosOutputAssetTemplate, IosOutputAssetTemplateSplash } from '../../definitions';
import { AssetKind, Format, IosIconAppearance, IosIdiom, Orientation, Platform, Theme } from '../../definitions';

/**
 * 1024px Icon
 *
 * - iOS 1024 icon (Xcode 14+ single-size)
 */
export const IOS_1024_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  idiom: IosIdiom.Universal,
  kind: AssetKind.Icon,
  name: 'AppIcon-512@2x.png',
  format: Format.Png,
  width: 1024,
  height: 1024,
  appearance: IosIconAppearance.Any,
};

/**
 * iOS 18+ dark appearance icon. Apple expects a transparent background so
 * the system-provided dark background can show through.
 */
export const IOS_1024_ICON_DARK: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  idiom: IosIdiom.Universal,
  kind: AssetKind.Icon,
  name: 'AppIcon-512@2x-dark.png',
  format: Format.Png,
  width: 1024,
  height: 1024,
  appearance: IosIconAppearance.Dark,
};

/**
 * iOS 18+ tinted appearance icon. Apple expects a fully opaque grayscale
 * image; the system applies the user's tint color.
 */
export const IOS_1024_ICON_TINTED: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  idiom: IosIdiom.Universal,
  kind: AssetKind.Icon,
  name: 'AppIcon-512@2x-tinted.png',
  format: Format.Png,
  width: 1024,
  height: 1024,
  appearance: IosIconAppearance.Tinted,
};

export const IOS_1X_UNIVERSAL_ANYANY_SPLASH: IosOutputAssetTemplateSplash = {
  platform: Platform.Ios,
  idiom: IosIdiom.Universal,
  kind: AssetKind.Splash,
  name: 'Default@1x~universal~anyany.png',
  format: Format.Png,
  width: 2732,
  height: 2732,
  orientation: Orientation.Portrait,
  scale: 1,
  theme: Theme.Any,
};

export const IOS_2X_UNIVERSAL_ANYANY_SPLASH: IosOutputAssetTemplateSplash = {
  platform: Platform.Ios,
  idiom: IosIdiom.Universal,
  kind: AssetKind.Splash,
  name: 'Default@2x~universal~anyany.png',
  format: Format.Png,
  width: 2732,
  height: 2732,
  orientation: Orientation.Portrait,
  scale: 2,
  theme: Theme.Any,
};

export const IOS_3X_UNIVERSAL_ANYANY_SPLASH: IosOutputAssetTemplateSplash = {
  platform: Platform.Ios,
  idiom: IosIdiom.Universal,
  kind: AssetKind.Splash,
  name: 'Default@3x~universal~anyany.png',
  format: Format.Png,
  width: 2732,
  height: 2732,
  orientation: Orientation.Portrait,
  scale: 3,
  theme: Theme.Any,
};

export const IOS_1X_UNIVERSAL_ANYANY_SPLASH_DARK: IosOutputAssetTemplateSplash = {
  platform: Platform.Ios,
  idiom: IosIdiom.Universal,
  kind: AssetKind.SplashDark,
  name: 'Default@1x~universal~anyany-dark.png',
  format: Format.Png,
  width: 2732,
  height: 2732,
  orientation: Orientation.Portrait,
  scale: 1,
  theme: Theme.Dark,
};

export const IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK: IosOutputAssetTemplateSplash = {
  platform: Platform.Ios,
  idiom: IosIdiom.Universal,
  kind: AssetKind.SplashDark,
  name: 'Default@2x~universal~anyany-dark.png',
  format: Format.Png,
  width: 2732,
  height: 2732,
  orientation: Orientation.Portrait,
  scale: 2,
  theme: Theme.Dark,
};

export const IOS_3X_UNIVERSAL_ANYANY_SPLASH_DARK: IosOutputAssetTemplateSplash = {
  platform: Platform.Ios,
  idiom: IosIdiom.Universal,
  kind: AssetKind.SplashDark,
  name: 'Default@3x~universal~anyany-dark.png',
  format: Format.Png,
  width: 2732,
  height: 2732,
  orientation: Orientation.Portrait,
  scale: 3,
  theme: Theme.Dark,
};
