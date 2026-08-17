import type { PwaOutputAssetTemplate } from '../../definitions';
import { AssetKind, Format, Platform } from '../../definitions';

/**
 * Web app manifest icons. 192 and 512 are required for the Chromium install
 * prompt; 1024 is used by macOS Safari web apps. Legacy small sizes
 * (48–256) are no longer needed — browsers downscale.
 */
export const PWA_192_PX_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-192.png',
  format: Format.Png,
  width: 192,
  height: 192,
  purpose: 'any',
};

export const PWA_512_PX_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-512.png',
  format: Format.Png,
  width: 512,
  height: 512,
  purpose: 'any',
};

export const PWA_1024_PX_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-1024.png',
  format: Format.Png,
  width: 1024,
  height: 1024,
  purpose: 'any',
};

/**
 * Maskable icon: the source is composited onto an opaque background with
 * the art confined to the central safe zone (the spec guarantees only a
 * circle of radius 40% of the icon size survives masking).
 */
export const PWA_512_PX_ICON_MASKABLE: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'icon-512-maskable.png',
  format: Format.Png,
  width: 512,
  height: 512,
  purpose: 'maskable',
};

/**
 * apple-touch-icon: iOS Safari prefers this link tag over manifest icons
 * for Add to Home Screen, requires PNG, and composites its own mask —
 * so it must be opaque with no pre-rounded corners. Not a manifest icon.
 */
export const PWA_APPLE_TOUCH_ICON: PwaOutputAssetTemplate = {
  platform: Platform.Pwa,
  kind: AssetKind.Icon,
  name: 'apple-touch-icon.png',
  format: Format.Png,
  width: 180,
  height: 180,
  purpose: 'any',
  excludeFromManifest: true,
};

export const ASSETS = {
  PWA_192_PX_ICON,
  PWA_512_PX_ICON,
  PWA_1024_PX_ICON,
  PWA_512_PX_ICON_MASKABLE,
  PWA_APPLE_TOUCH_ICON,
};

/**
 * Device sizes for apple-touch-startup-image links, as `WxH@Nx` physical
 * pixels (portrait). CSS point size = px / scale. Static list current as of
 * mid-2026 (through iPhone 17 / iPhone Air / M4-M5 iPad Pro); update as
 * Apple ships new screen sizes.
 */
export const PWA_IOS_DEVICE_SIZES = [
  // iPhone
  '1320x2868@3x', // 17 Pro Max, 16 Pro Max
  '1260x2736@3x', // iPhone Air
  '1206x2622@3x', // 17, 17 Pro, 16 Pro
  '1290x2796@3x', // 16 Plus, 15 Plus, 15 Pro Max, 14 Pro Max
  '1179x2556@3x', // 16, 16e, 15, 15 Pro, 14 Pro
  '1170x2532@3x', // 14, 13, 13 Pro, 12, 12 Pro
  '1284x2778@3x', // 14 Plus, 13 Pro Max, 12 Pro Max
  '1125x2436@3x', // 13 mini, 12 mini, 11 Pro, X, XS
  '1242x2688@3x', // 11 Pro Max, XS Max
  '828x1792@2x', // 11, XR
  '1242x2208@3x', // 8 Plus, 7 Plus, 6s Plus
  '750x1334@2x', // SE 2/3, 8, 7, 6s
  '640x1136@2x', // SE 1, iPod touch 7
  // iPad
  '2064x2752@2x', // iPad Pro 13" (M4/M5)
  '2048x2732@2x', // iPad Pro 12.9", iPad Air 13"
  '1668x2420@2x', // iPad Pro 11" (M4/M5)
  '1668x2388@2x', // iPad Pro 11" (gen 1-4), 10.5"
  '1640x2360@2x', // iPad Air 11"/10.9", iPad (10th gen/A16)
  '1668x2224@2x', // iPad Air 10.5"
  '1620x2160@2x', // iPad 10.2" (gen 7-9)
  '1488x2266@2x', // iPad mini 6/7 (8.3")
  '1536x2048@2x', // iPad 9.7", iPad mini 5 and earlier
];
