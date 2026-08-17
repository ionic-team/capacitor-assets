import type { PwaOutputAssetTemplate } from '../../definitions';
/**
 * Web app manifest icons. 192 and 512 are required for the Chromium install
 * prompt; 1024 is used by macOS Safari web apps. Legacy small sizes
 * (48–256) are no longer needed — browsers downscale.
 */
export declare const PWA_192_PX_ICON: PwaOutputAssetTemplate;
export declare const PWA_512_PX_ICON: PwaOutputAssetTemplate;
export declare const PWA_1024_PX_ICON: PwaOutputAssetTemplate;
/**
 * Maskable icon: the source is composited onto an opaque background with
 * the art confined to the central safe zone (the spec guarantees only a
 * circle of radius 40% of the icon size survives masking).
 */
export declare const PWA_512_PX_ICON_MASKABLE: PwaOutputAssetTemplate;
/**
 * apple-touch-icon: iOS Safari prefers this link tag over manifest icons
 * for Add to Home Screen, requires PNG, and composites its own mask —
 * so it must be opaque with no pre-rounded corners. Not a manifest icon.
 */
export declare const PWA_APPLE_TOUCH_ICON: PwaOutputAssetTemplate;
export declare const ASSETS: {
    PWA_192_PX_ICON: PwaOutputAssetTemplate;
    PWA_512_PX_ICON: PwaOutputAssetTemplate;
    PWA_1024_PX_ICON: PwaOutputAssetTemplate;
    PWA_512_PX_ICON_MASKABLE: PwaOutputAssetTemplate;
    PWA_APPLE_TOUCH_ICON: PwaOutputAssetTemplate;
};
/**
 * Device sizes for apple-touch-startup-image links, as `WxH@Nx` physical
 * pixels (portrait). CSS point size = px / scale. Static list current as of
 * mid-2026 (through iPhone 17 / iPhone Air / M4-M5 iPad Pro); update as
 * Apple ships new screen sizes.
 */
export declare const PWA_IOS_DEVICE_SIZES: string[];
