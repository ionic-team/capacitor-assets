import {
  AssetKind,
  Format,
  IosOutputAssetTemplate,
  IosOutputAssetTemplateIcon,
  IosOutputAssetTemplateSplash,
  Orientation,
  Platform,
  Theme,
} from '../../definitions';

/**
 * 20pt Icon
 *
 * - iPhone Notification (iOS 7+)
 * - iPad Notification (iOS 7+)
 */
export const IOS_20_PT_ICON: IosOutputAssetTemplateIcon = {
  platform: Platform.Ios,
  kind: AssetKind.NotificationIcon,
  name: 'AppIcon-20x20@1x.png',
  format: Format.Png,
  width: 20,
  height: 20,
  scale: 1,
};

export const IOS_20_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.NotificationIcon,
  name: 'AppIcon-20x20@2x.png',
  format: Format.Png,
  width: 40,
  height: 40,
  scale: 2,
};

export const IOS_20_PT_2X_1_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.NotificationIcon,
  name: 'AppIcon-20x20@2x-1.png',
  format: Format.Png,
  width: 40,
  height: 40,
  scale: 2,
};

export const IOS_20_PT_3X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.NotificationIcon,
  name: 'AppIcon-20x20@3x.png',
  format: Format.Png,
  width: 60,
  height: 60,
  scale: 3,
};

/**
 * 29pt Icon
 *
 * - iPhone Settings (iOS 7+)
 * - iPad Settings (iOS 7+)
 * - Apple Watch Companion Settings
 * - Apple Watch Notification Center
 */
export const IOS_29_PT_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.SettingsIcon,
  name: 'AppIcon-29x29@1x.png',
  format: Format.Png,
  width: 29,
  height: 29,
  scale: 1,
};

export const IOS_29_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.SettingsIcon,
  name: 'AppIcon-29x29@2x.png',
  format: Format.Png,
  width: 58,
  height: 58,
  scale: 2,
};

export const IOS_29_PT_2X_1_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.SettingsIcon,
  name: 'AppIcon-29x29@2x-1.png',
  format: Format.Png,
  width: 58,
  height: 58,
  scale: 2,
};

export const IOS_29_PT_3X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.SettingsIcon,
  name: 'AppIcon-29x29@3x.png',
  format: Format.Png,
  width: 87,
  height: 87,
  scale: 3,
};

/**
 * 40pt Icon
 *
 * - iPhone Spotlight (iOS 7+)
 * - iPad Spotlight (iOS 7+)
 * - Apple Watch Home Screen
 */
export const IOS_40_PT_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.SpotlightIcon,
  name: 'AppIcon-40x40@1x.png',
  format: Format.Png,
  width: 40,
  height: 40,
  scale: 1,
};

export const IOS_40_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.SpotlightIcon,
  name: 'AppIcon-40x40@2x.png',
  format: Format.Png,
  width: 80,
  height: 80,
  scale: 2,
};

export const IOS_40_PT_2X_1_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.SpotlightIcon,
  name: 'AppIcon-40x40@2x-1.png',
  format: Format.Png,
  width: 80,
  height: 80,
  scale: 2,
};

export const IOS_40_PT_3X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.SpotlightIcon,
  name: 'AppIcon-40x40@3x.png',
  format: Format.Png,
  width: 120,
  height: 120,
  scale: 3,
};

/**
 * 60pt Icon
 *
 * - iPhone App (iOS 7+)
 */

export const IOS_60_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-60x60@2x.png',
  format: Format.Png,
  width: 120,
  height: 120,
  scale: 2,
};

export const IOS_60_PT_3X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-60x60@3x.png',
  format: Format.Png,
  width: 180,
  height: 180,
  scale: 3,
};

/**
 * 76pt Icon
 *
 * - iPad App (iOS 7+)
 */
export const IOS_76_PT_1X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-76x76@1x.png',
  format: Format.Png,
  width: 76,
  height: 76,
  scale: 1,
};

export const IOS_76_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-76x76@2x.png',
  format: Format.Png,
  width: 152,
  height: 152,
  scale: 2,
};

/**
 * 83.5pt Icon
 *
 * iPad Pro (12.9-inch)
 */
export const IOS_83_5_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-83.5x83.5@2x.png',
  format: Format.Png,
  width: 167,
  height: 167,
  scale: 2,
};

/**
 * 1024px Icon
 *
 * - App Store
 */
export const IOS_1024_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-512@2x.png',
  format: Format.Png,
  width: 1024,
  height: 1024,
  scale: 1,
};

export const IOS_1X_UNIVERSAL_ANYANY_SPLASH: IosOutputAssetTemplateSplash = {
  platform: Platform.Ios,
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
  kind: AssetKind.SplashDark,
  name: 'Default@3x~universal~anyany-dark.png',
  format: Format.Png,
  width: 2732,
  height: 2732,
  orientation: Orientation.Portrait,
  scale: 3,
  theme: Theme.Dark,
};
