import type { PwaOutputAssetTemplate } from '../../definitions';
import { AssetKind, Format, Platform } from '../../definitions';

export const PWA_48_PX_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-48.webp',
  format: Format.WebP,
  width: 48,
  height: 48,
};
export const PWA_72_PX_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-72.webp',
  format: Format.WebP,
  width: 72,
  height: 72,
};
export const PWA_96_PX_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-96.webp',
  format: Format.WebP,
  width: 96,
  height: 96,
};
export const PWA_128_PX_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-128.webp',
  format: Format.WebP,
  width: 128,
  height: 128,
};
export const PWA_192_PX_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-192.webp',
  format: Format.WebP,
  width: 192,
  height: 192,
};
export const PWA_256_PX_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-256.webp',
  format: Format.WebP,
  width: 256,
  height: 256,
};
export const PWA_512_PX_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-512.webp',
  format: Format.WebP,
  width: 512,
  height: 512,
};

export const PWA_SPLASH: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Splash,
  name: 'apple-splash.webp',
  format: Format.WebP,
  width: 2048,
  height: 2048,
};

export const ASSETS = {
  PWA_48_PX_ICON,
  PWA_72_PX_ICON,
  PWA_96_PX_ICON,
  PWA_128_PX_ICON,
  PWA_192_PX_ICON,
  PWA_256_PX_ICON,
  PWA_512_PX_ICON,
  PWA_SPLASH,
};

// From https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/
export const PWA_IOS_DEVICE_SIZES = [
  '2048x2732@2x',
  '1668x2388@2x',
  '1668x2224@2x',
  '1620x2160@2x',
  '1536x2048@2x',
  '1284x2778@3x',
  '1242x2688@3x',
  '1170x2532@3x',
  '1125x2436@3x',
  '1080x1920@3x',
  '828x1792@2x',
  '750x1334@2x',
  '640x1136@2x',
];
