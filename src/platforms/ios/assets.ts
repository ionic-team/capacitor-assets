import { AssetKind, AssetMeta, Format, Orientation, Platform, Theme } from "../../definitions";


export const IOS_2X_UNIVERSAL_ANYANY_SPLASH: AssetMeta = {
  platform: Platform.Ios,
  kind: AssetKind.Splash,
  name: 'Default@2x~universal~anyany.png',
  format: Format.Png,
  width: 2732,
  height: 2732,
  orientation: Orientation.Portrait,
  scale: 2,
  theme: Theme.Any
};

export const IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK: AssetMeta = {
  platform: Platform.Ios,
  kind: AssetKind.SplashDark,
  name: 'Default@2x~universal~anyany-dark.png',
  format: Format.Png,
  width: 2732,
  height: 2732,
  orientation: Orientation.Portrait,
  scale: 2,
  theme: Theme.Dark
};