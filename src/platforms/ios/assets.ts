import {
  AssetKind,
  Format,
  IosOutputAssetTemplate,
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
export const IOS_20_PT_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.NotificationIcon,
  name: 'AppIcon-20x20.png',
  format: Format.Png,
  width: 20,
  height: 20,
  scale: 1,
};

export const IOS_20_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.NotificationIcon,
  name: 'AppIcon-20x20x20@2x.png',
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
  name: 'AppIcon-29x29.png',
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
  name: 'AppIcon-40x40.png',
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
 * 50pt Icon
 *
 * - iPad Spotlight (iOS 5,6)
 * - Apple Watch Home Screen
 */
export const IOS_50_PT_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.SpotlightIcon,
  name: 'AppIcon-50x50.png',
  format: Format.Png,
  width: 50,
  height: 50,
  scale: 1,
};

export const IOS_50_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.SpotlightIcon,
  name: 'AppIcon-50x50@2x.png',
  format: Format.Png,
  width: 100,
  height: 100,
  scale: 2,
};

/**
 * 57pt Icon
 *
 * - iPhone App (iOS 5,6)
 */
export const IOS_57_PT_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'icon.png',
  format: Format.Png,
  width: 57,
  height: 57,
  scale: 1,
};

export const IOS_57_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'icon@2x.png',
  format: Format.Png,
  width: 114,
  height: 114,
  scale: 2,
};

/**
 * 60pt Icon
 *
 * - iPhone App (iOS 7+)
 */
export const IOS_60_PT_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-60x60.png',
  format: Format.Png,
  width: 60,
  height: 60,
  scale: 1,
};

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
 * 72pt Icon
 *
 * - iPad App (iOS 5,6)
 */
export const IOS_72_PT_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-72x72.png',
  format: Format.Png,
  width: 72,
  height: 72,
  scale: 1,
};

export const IOS_72_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-72x72@2x.png',
  format: Format.Png,
  width: 144,
  height: 144,
  scale: 2,
};

/**
 * 76pt Icon
 *
 * - iPad App (iOS 7+)
 */
export const IOS_76_PT_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-76x76.png',
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
  name: 'AppIcon-1024x1024.png',
  format: Format.Png,
  width: 1024,
  height: 1024,
  scale: 1,
};

/**
 * 24pt Icon
 *
 * - Apple Watch Notification Center
 */
export const IOS_24_PT_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-24x24@2x.png',
  format: Format.Png,
  width: 48,
  height: 48,
  scale: 2,
};

/**
 * 27.5pt Icon
 *
 * - Apple Watch Notification Center
 */
export const IOS_27_5_PT_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-27.5x27.5@2x.png',
  format: Format.Png,
  width: 55,
  height: 55,
  scale: 2,
};

/**
 * 44pt Icon
 *
 * - Apple Watch Home Screen
 */
export const IOS_44_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-44x44@2x.png',
  format: Format.Png,
  width: 88,
  height: 88,
  scale: 2,
};

/**
 * 86pt Icon
 *
 * - Apple Watch Short Look
 */
export const IOS_86_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-86x86@2x.png',
  format: Format.Png,
  width: 172,
  height: 172,
  scale: 2,
};

/**
 * 98pt Icon
 *
 * - Apple Watch Short Look
 */
export const IOS_98_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-98x98@2x.png',
  format: Format.Png,
  width: 196,
  height: 196,
  scale: 2,
};

/**
 * 108pt Icon
 *
 * - Apple Watch Short Look
 */
export const IOS_108_PT_2X_ICON: IosOutputAssetTemplate = {
  platform: Platform.Ios,
  kind: AssetKind.Icon,
  name: 'AppIcon-108x108@2x.png',
  format: Format.Png,
  width: 216,
  height: 216,
  scale: 2,
};

export const IOS_2X_UNIVERSAL_ANYANY_SPLASH: IosOutputAssetTemplate = {
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

export const IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK: IosOutputAssetTemplate = {
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
