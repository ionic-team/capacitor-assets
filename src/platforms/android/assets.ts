import {
  AssetKind,
  AndroidAssetMeta,
  Density,
  Format,
  Orientation,
  Platform,
} from '../../definitions';

export const ANDROID_LDPI_ADAPTIVE_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.AdaptiveIcon,
  nameForeground: 'ldpi-foreground.png',
  nameBackground: 'ldpi-background.png',
  format: Format.Png,
  width: 81,
  height: 81,
  density: Density.Ldpi,
};

export const ANDROID_MDPI_ADAPTIVE_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.AdaptiveIcon,
  nameForeground: 'mdpi-foreground.png',
  nameBackground: 'mdpi-background.png',
  format: Format.Png,
  width: 108,
  height: 108,
  density: Density.Mdpi,
};

export const ANDROID_HDPI_ADAPTIVE_ICON: AndroidAssetMeta = {
  nameForeground: 'hdpi-foreground.png',
  platform: Platform.Android,
  kind: AssetKind.AdaptiveIcon,
  nameBackground: 'hdpi-background.png',
  format: Format.Png,
  width: 162,
  height: 162,
  density: Density.Hdpi,
};

export const ANDROID_XHDPI_ADAPTIVE_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.AdaptiveIcon,
  nameForeground: 'xhdpi-foreground.png',
  nameBackground: 'xhdpi-background.png',
  format: Format.Png,
  width: 216,
  height: 216,
  density: Density.Xhdpi,
};

export const ANDROID_XXHDPI_ADAPTIVE_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.AdaptiveIcon,
  nameForeground: 'xxhdpi-foreground.png',
  nameBackground: 'xxhdpi-background.png',
  format: Format.Png,
  width: 324,
  height: 324,
  density: Density.Xxhdpi,
};

export const ANDROID_XXXHDPI_ADAPTIVE_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.AdaptiveIcon,
  nameForeground: 'xxxhdpi-foreground.png',
  nameBackground: 'xxxhdpi-background.png',
  format: Format.Png,
  width: 432,
  height: 432,
  density: Density.Xxxhdpi,
};

export const ANDROID_LDPI_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Icon,
  name: 'drawable-ldpi-icon.png',
  format: Format.Png,
  width: 36,
  height: 36,
  density: Density.Ldpi,
};

export const ANDROID_MDPI_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Icon,
  name: 'drawable-mdpi-icon.png',
  format: Format.Png,
  width: 48,
  height: 48,
  density: Density.Mdpi,
};

export const ANDROID_HDPI_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Icon,
  name: 'drawable-hdpi-icon.png',
  format: Format.Png,
  width: 72,
  height: 72,
  density: Density.Hdpi,
};

export const ANDROID_XHDPI_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Icon,
  name: 'drawable-xhdpi-icon.png',
  format: Format.Png,
  width: 96,
  height: 96,
  density: Density.Xhdpi,
};

export const ANDROID_XXHDPI_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Icon,
  name: 'drawable-xxhdpi-icon.png',
  format: Format.Png,
  width: 144,
  height: 144,
  density: Density.Xxhdpi,
};

export const ANDROID_XXXHDPI_ICON: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Icon,
  name: 'drawable-xxxhdpi-icon.png',
  format: Format.Png,
  width: 192,
  height: 192,
  density: Density.Xxxhdpi,
};

export const ANDROID_LAND_LDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-land-ldpi-screen.png',
  format: Format.Png,
  width: 320,
  height: 240,
  density: Density.LandLdpi,
  orientation: Orientation.Landscape,
};

export const ANDROID_LAND_MDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-land-mdpi-screen.png',
  format: Format.Png,
  width: 480,
  height: 320,
  density: Density.LandMdpi,
  orientation: Orientation.Landscape,
};

export const ANDROID_LAND_HDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-land-hdpi-screen.png',
  format: Format.Png,
  width: 800,
  height: 480,
  density: Density.LandHdpi,
  orientation: Orientation.Landscape,
};

export const ANDROID_LAND_XHDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-land-xhdpi-screen.png',
  format: Format.Png,
  width: 1280,
  height: 720,
  density: Density.LandXhdpi,
  orientation: Orientation.Landscape,
};

export const ANDROID_LAND_XXHDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-land-xxhdpi-screen.png',
  format: Format.Png,
  width: 1600,
  height: 960,
  density: Density.LandXxhdpi,
  orientation: Orientation.Landscape,
};

export const ANDROID_LAND_XXXHDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-land-xxxhdpi-screen.png',
  format: Format.Png,
  width: 1920,
  height: 1280,
  density: Density.LandXxxhdpi,
  orientation: Orientation.Landscape,
};

export const ANDROID_PORT_LDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-port-ldpi-screen.png',
  format: Format.Png,
  width: 240,
  height: 320,
  density: Density.PortLdpi,
  orientation: Orientation.Portrait,
};

export const ANDROID_PORT_MDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-port-mdpi-screen.png',
  format: Format.Png,
  width: 320,
  height: 480,
  density: Density.PortMdpi,
  orientation: Orientation.Portrait,
};

export const ANDROID_PORT_HDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-port-hdpi-screen.png',
  format: Format.Png,
  width: 480,
  height: 800,
  density: Density.PortHdpi,
  orientation: Orientation.Portrait,
};

export const ANDROID_PORT_XHDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-port-xhdpi-screen.png',
  format: Format.Png,
  width: 720,
  height: 1280,
  density: Density.PortXhdpi,
  orientation: Orientation.Portrait,
};

export const ANDROID_PORT_XXHDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-port-xxhdpi-screen.png',
  format: Format.Png,
  width: 960,
  height: 1600,
  density: Density.PortXxhdpi,
  orientation: Orientation.Portrait,
};

export const ANDROID_PORT_XXXHDPI_SCREEN: AndroidAssetMeta = {
  platform: Platform.Android,
  kind: AssetKind.Splash,
  name: 'drawable-port-xxxhdpi-screen.png',
  format: Format.Png,
  width: 1280,
  height: 1920,
  density: Density.PortXxxhdpi,
  orientation: Orientation.Portrait,
};

/*
export const ANDROID_ICONS: readonly NativeResource[] = [
  {
    type: NativeResourceType.ANDROID_LEGACY,
    source: ANDROID_MDPI_ICON.src,
    target: 'mipmap-mdpi/ic_launcher.png',
  },
  {
    type: NativeResourceType.ANDROID_ROUND,
    source: ANDROID_MDPI_ICON.src,
    target: 'mipmap-mdpi/ic_launcher_round.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_FOREGROUND,
    source: ANDROID_MDPI_ADAPTIVE_ICON.foreground,
    target: 'mipmap-mdpi/ic_launcher_foreground.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_BACKGROUND,
    source: ANDROID_MDPI_ADAPTIVE_ICON.background,
    target: 'mipmap-mdpi/ic_launcher_background.png',
  },
  {
    type: NativeResourceType.ANDROID_LEGACY,
    source: ANDROID_HDPI_ICON.src,
    target: 'mipmap-hdpi/ic_launcher.png',
  },
  {
    type: NativeResourceType.ANDROID_ROUND,
    source: ANDROID_HDPI_ICON.src,
    target: 'mipmap-hdpi/ic_launcher_round.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_FOREGROUND,
    source: ANDROID_HDPI_ADAPTIVE_ICON.foreground,
    target: 'mipmap-hdpi/ic_launcher_foreground.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_BACKGROUND,
    source: ANDROID_HDPI_ADAPTIVE_ICON.background,
    target: 'mipmap-hdpi/ic_launcher_background.png',
  },
  {
    type: NativeResourceType.ANDROID_LEGACY,
    source: ANDROID_XHDPI_ICON.src,
    target: 'mipmap-xhdpi/ic_launcher.png',
  },
  {
    type: NativeResourceType.ANDROID_ROUND,
    source: ANDROID_XHDPI_ICON.src,
    target: 'mipmap-xhdpi/ic_launcher_round.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_FOREGROUND,
    source: ANDROID_XHDPI_ADAPTIVE_ICON.foreground,
    target: 'mipmap-xhdpi/ic_launcher_foreground.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_BACKGROUND,
    source: ANDROID_XHDPI_ADAPTIVE_ICON.background,
    target: 'mipmap-xhdpi/ic_launcher_background.png',
  },
  {
    type: NativeResourceType.ANDROID_LEGACY,
    source: ANDROID_XXHDPI_ICON.src,
    target: 'mipmap-xxhdpi/ic_launcher.png',
  },
  {
    type: NativeResourceType.ANDROID_ROUND,
    source: ANDROID_XXHDPI_ICON.src,
    target: 'mipmap-xxhdpi/ic_launcher_round.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_FOREGROUND,
    source: ANDROID_XXHDPI_ADAPTIVE_ICON.foreground,
    target: 'mipmap-xxhdpi/ic_launcher_foreground.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_BACKGROUND,
    source: ANDROID_XXHDPI_ADAPTIVE_ICON.background,
    target: 'mipmap-xxhdpi/ic_launcher_background.png',
  },
  {
    type: NativeResourceType.ANDROID_LEGACY,
    source: ANDROID_XXXHDPI_ICON.src,
    target: 'mipmap-xxxhdpi/ic_launcher.png',
  },
  {
    type: NativeResourceType.ANDROID_ROUND,
    source: ANDROID_XXXHDPI_ICON.src,
    target: 'mipmap-xxxhdpi/ic_launcher_round.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_FOREGROUND,
    source: ANDROID_XXXHDPI_ADAPTIVE_ICON.foreground,
    target: 'mipmap-xxxhdpi/ic_launcher_foreground.png',
  },
  {
    type: NativeResourceType.ANDROID_ADAPTIVE_BACKGROUND,
    source: ANDROID_XXXHDPI_ADAPTIVE_ICON.background,
    target: 'mipmap-xxxhdpi/ic_launcher_background.png',
  },
];

export const ANDROID_SPLASHES: readonly NativeResource[] = [
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_MDPI_SCREEN.src,
    target: 'drawable/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_MDPI_SCREEN.src,
    target: 'drawable-land-mdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_HDPI_SCREEN.src,
    target: 'drawable-land-hdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_XHDPI_SCREEN.src,
    target: 'drawable-land-xhdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_XXHDPI_SCREEN.src,
    target: 'drawable-land-xxhdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_LAND_XXXHDPI_SCREEN.src,
    target: 'drawable-land-xxxhdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_PORT_MDPI_SCREEN.src,
    target: 'drawable-port-mdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_PORT_HDPI_SCREEN.src,
    target: 'drawable-port-hdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_PORT_XHDPI_SCREEN.src,
    target: 'drawable-port-xhdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_PORT_XXHDPI_SCREEN.src,
    target: 'drawable-port-xxhdpi/splash.png',
  },
  {
    type: NativeResourceType.ANDROID_SPLASH,
    source: ANDROID_PORT_XXXHDPI_SCREEN.src,
    target: 'drawable-port-xxxhdpi/splash.png',
  },
];
*/
