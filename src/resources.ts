import pathlib from 'path';
import type { Metadata, Sharp } from 'sharp';
import util from 'util';

import { BadInputError, ValidationError, ValidationErrorCode } from './error';
import { Platform, prettyPlatform } from './platform';

export const enum ResourceType {
  ADAPTIVE_ICON = 'adaptive-icon',
  ICON = 'icon',
  SPLASH = 'splash',
}

export const RESOURCE_TYPES: readonly ResourceType[] = [
  ResourceType.ADAPTIVE_ICON,
  ResourceType.ICON,
  ResourceType.SPLASH,
];

export const enum SourceType {
  RASTER = 'raster',
  COLOR = 'color',

  // TODO: support vectors via Android XML
}

export interface ImageSource {
  type: SourceType.RASTER;

  /**
   * Path to source image.
   */
  src: string;
}

export interface ColorSource {
  type: SourceType.COLOR;

  /**
   * Hex value.
   */
  color: string;
}

export type Source = ImageSource | ColorSource;

export interface ImageSourceData {
  src: string;
  pipeline: Sharp;
  metadata: Metadata;
}

export interface ResolvedImageSource extends ImageSource {
  platform: Platform;
  resource: ResourceType;
  image: ImageSourceData;
}

export interface ResolvedColorSource extends ColorSource {
  platform: Platform;
  resource: ResourceType;
  name: string;
}

export type ResolvedSource = ResolvedImageSource | ResolvedColorSource;

export const RESOURCE_FORMATS: readonly Format[] = [Format.JPEG, Format.PNG];
export const RESOURCE_RASTER_FORMATS: readonly Format[] = [
  Format.JPEG,
  Format.PNG,
];

export function isResourceFormat(format: any): format is Format {
  return RESOURCE_FORMATS.includes(format);
}

export function isRasterResourceFormat(format: any): format is Format {
  return RESOURCE_RASTER_FORMATS.includes(format);
}

export interface RasterResourceSchema {
  /**
   * The expected width.
   */
  width: number;

  /**
   * The expected height.
   */
  height: number;

  /**
   * Whether transparency is allowed or not.
   */
  alpha: boolean;
}

export async function validateRasterResource(
  platform: Platform,
  type: ResourceType,
  source: string,
  metadata: Metadata,
  schema: RasterResourceSchema,
  errstream: NodeJS.WritableStream | null,
): Promise<void> {
  const { format, width, height } = metadata;
  const { width: requiredWidth, height: requiredHeight } = schema;

  if (!format || !isRasterResourceFormat(format)) {
    throw new ValidationError(
      util.format(
        `The format of source images for %s %s must be one of: (%s) (image format is "%s").`,
        prettyPlatform(platform),
        prettyResourceType(type, { pluralize: true }),
        RESOURCE_RASTER_FORMATS.join(', '),
        format,
      ),
      {
        source,
        type,
        code: ValidationErrorCode.BAD_IMAGE_FORMAT,
        format,
        requiredFormats: RESOURCE_RASTER_FORMATS,
      },
    );
  }

  if (!width || !height || width < requiredWidth || height < requiredHeight) {
    throw new ValidationError(
      util.format(
        `The dimensions of source images for %s %s do not meet minimum size requirements: %dx%d (image is %dx%d).`,
        prettyPlatform(platform),
        prettyResourceType(type, { pluralize: true }),
        requiredWidth,
        requiredHeight,
        width,
        height,
      ),
      {
        source,
        type,
        code: ValidationErrorCode.BAD_IMAGE_SIZE,
        width,
        height,
        requiredWidth,
        requiredHeight,
      },
    );
  }

  if (!schema.alpha && metadata.hasAlpha) {
    const platformSpecificMessage =
      platform === Platform.IOS && type === ResourceType.ICON
        ? '\n' +
          '\tApple recommends avoiding transparency. See the App Icon Human Interface Guidelines[1] for details. Any transparency in your icon will be filled in with white.\n\n' +
          '\t[1]: https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/\n'
        : '';

    // @see https://github.com/ionic-team/cordova-res/issues/94
    errstream?.write(
      util.format(
        'WARN:\tSource %s "%s" contains alpha channel, generated %s for %s will not.\n' +
          platformSpecificMessage,
        prettyResourceType(type),
        source,
        prettyResourceType(type, { pluralize: true }),
        prettyPlatform(platform),
      ) + '\n',
    );
  }
}

export const COLOR_REGEX = /^#[A-F0-9]{6}$/;

export function getRasterResourceSchema(
  platform: Platform,
  type: ResourceType,
): RasterResourceSchema {
  switch (platform) {
    case Platform.ANDROID:
      switch (type) {
        case ResourceType.ADAPTIVE_ICON:
          return {
            width: 432,
            height: 432,
            alpha: true,
          };
        case ResourceType.ICON:
          /**
           * The Play Store icon is not generated as a resource, but we keep
           * the requirement 512x512 so it can be used for the Play Store icon.
           *
           * @see https://developer.android.com/google-play/resources/icon-design-specifications#attributes
           */
          return {
            width: 512,
            height: 512,
            alpha: true,
          };
        case ResourceType.SPLASH:
          /**
           * The landscape and portrait splash screens for Android have a
           * maximum respective width and height of 1920, so we require
           * a source image of 1920x1920.
           */
          return {
            width: 1920,
            height: 1920,
            alpha: true,
          };
      }
    case Platform.IOS:
      switch (type) {
        case ResourceType.ICON:
          /**
           * The App Store icon is generated as a resource. Apple requires App
           * Store icons to be 1024x1024.
           *
           * If alpha channels exist in iOS icons when uploaded to the App
           * Store, the app may be rejected referencing ITMS-90717.
           *
           * @see https://github.com/ionic-team/cordova-res/issues/94
           */
          return {
            width: 1024,
            height: 1024,
            alpha: false,
          };
        case ResourceType.SPLASH:
          /**
           * The 2x universal splash screen is 2732x2732.
           */
          return {
            width: 2732,
            height: 2732,
            alpha: true,
          };
      }
      break;
    case Platform.WINDOWS:
      switch (type) {
        case ResourceType.ICON:
          /**
           * The largest icon for Windows is 310x310. At a maximum scale factor
           * of 400%, the requirement is 1240x1240.
           *
           * @see https://docs.microsoft.com/en-us/windows/uwp/design/style/app-icons-and-logos
           */
          return {
            width: 1240,
            height: 1240,
            alpha: true,
          };
        case ResourceType.SPLASH:
          /**
           * There is only one generated splash screen resource for Windows,
           * and it is 620x300. At a maximum scale factor of 400%, the
           * requirement is 2480x1200.
           *
           * @see https://msdn.microsoft.com/en-us/windows/desktop/hh465338
           */
          return {
            width: 2480,
            height: 1200,
            alpha: true,
          };
      }
  }

  throw new BadInputError(
    `Unsupported platform/resource type combination: ${platform}/${type}`,
  );
}

export async function validateResource(
  platform: Platform,
  type: ResourceType,
  source: string,
  pipeline: Sharp,
  errstream: NodeJS.WritableStream | null,
): Promise<Metadata> {
  const metadata = await pipeline.metadata();
  const schema = getRasterResourceSchema(platform, type);

  await validateRasterResource(
    platform,
    type,
    source,
    metadata,
    schema,
    errstream,
  );

  return metadata;
}

export interface PrettyResourceTypeOptions {
  pluralize?: boolean;
}

export function prettyResourceType(
  type: ResourceType,
  { pluralize = false }: PrettyResourceTypeOptions = {},
): string {
  switch (type) {
    case ResourceType.ADAPTIVE_ICON:
      return 'adaptive icon' + (pluralize ? 's' : '');
    case ResourceType.ICON:
      return 'icon' + (pluralize ? 's' : '');
    case ResourceType.SPLASH:
      return 'splash screen' + (pluralize ? 's' : '');
  }
}

export const enum Format {
  NONE = 'none',
  PNG = 'png',
  JPEG = 'jpeg',
}

export const enum Orientation {
  LANDSCAPE = 'landscape',
  PORTRAIT = 'portrait',
}

export const enum Density {
  LDPI = 'ldpi',
  MDPI = 'mdpi',
  HDPI = 'hdpi',
  XHDPI = 'xhdpi',
  XXHDPI = 'xxhdpi',
  XXXHDPI = 'xxxhdpi',
  LAND_LDPI = 'land-ldpi',
  LAND_MDPI = 'land-mdpi',
  LAND_HDPI = 'land-hdpi',
  LAND_XHDPI = 'land-xhdpi',
  LAND_XXHDPI = 'land-xxhdpi',
  LAND_XXXHDPI = 'land-xxxhdpi',
  PORT_LDPI = 'port-ldpi',
  PORT_MDPI = 'port-mdpi',
  PORT_HDPI = 'port-hdpi',
  PORT_XHDPI = 'port-xhdpi',
  PORT_XXHDPI = 'port-xxhdpi',
  PORT_XXXHDPI = 'port-xxxhdpi',
}

/**
 * @see https://cordova.apache.org/docs/en/latest/config_ref/images.html#windows
 */
export const enum Target {
  STORE_LOGO = 'StoreLogo',
  SQUARE_30_X_30_LOGO = 'Square30x30Logo',
  SQUARE_44_X_44_LOGO = 'Square44x44Logo',
  SQUARE_70_X_70_LOGO = 'Square70x70Logo',
  SQUARE_71_X_71_LOGO = 'Square71x71Logo',
  SQUARE_150_X_150_LOGO = 'Square150x150Logo',
  SQUARE_310_X_310_LOGO = 'Square310x310Logo',
  WIDE_310_X_150_LOGO = 'Wide310x150Logo',
  SPLASH_SCREEN = 'SplashScreen',
}

export const enum ResourceKey {
  SRC = 'src',
  FOREGROUND = 'foreground',
  BACKGROUND = 'background',
  FORMAT = 'format',
  WIDTH = 'width',
  HEIGHT = 'height',
  DENSITY = 'density',
  SCALE = 'scale',
  ORIENTATION = 'orientation',
  TARGET = 'target',
}

export interface ResourceKeyValues {
  readonly [ResourceKey.SRC]: string;
  readonly [ResourceKey.FOREGROUND]: string;
  readonly [ResourceKey.BACKGROUND]: string;
  readonly [ResourceKey.FORMAT]: Format;
  readonly [ResourceKey.WIDTH]: number;
  readonly [ResourceKey.HEIGHT]: number;
  readonly [ResourceKey.DENSITY]: Density;
  readonly [ResourceKey.SCALE]: number;
  readonly [ResourceKey.ORIENTATION]: Orientation;
  readonly [ResourceKey.TARGET]: Target;
}

export type ResourceValue = ResourceKeyValues[ResourceKey];

export interface PlatformAndType<P extends Platform, T extends ResourceType> {
  readonly platform: P;
  readonly type: T;
}

export type UnknownResource = Partial<ResourceKeyValues> &
  PlatformAndType<Platform, ResourceType>;

export type BaseResourceConfig<
  P extends Platform,
  T extends ResourceType,
  R extends keyof ResourceKeyValues,
> = { [K in R]: ResourceKeyValues[K] } & PlatformAndType<P, T>;

export type ImageResourceKey =
  | ResourceKey.FORMAT
  | ResourceKey.WIDTH
  | ResourceKey.HEIGHT;

export type AndroidAdaptiveIconResourceConfig = BaseResourceConfig<
  Platform.ANDROID,
  ResourceType.ADAPTIVE_ICON,
  | ImageResourceKey
  | ResourceKey.FOREGROUND
  | ResourceKey.BACKGROUND
  | ResourceKey.DENSITY
>;

export type AndroidIconResourceConfig = BaseResourceConfig<
  Platform.ANDROID,
  ResourceType.ICON,
  ImageResourceKey | ResourceKey.SRC | ResourceKey.DENSITY
>;

export type AndroidSplashResourceConfig = BaseResourceConfig<
  Platform.ANDROID,
  ResourceType.SPLASH,
  | ImageResourceKey
  | ResourceKey.SRC
  | ResourceKey.DENSITY
  | ResourceKey.ORIENTATION
>;

export type IOSIconResourceConfig = BaseResourceConfig<
  Platform.IOS,
  ResourceType.ICON,
  ImageResourceKey | ResourceKey.SRC | ResourceKey.SCALE
>;

export type IOSSplashResourceConfig = BaseResourceConfig<
  Platform.IOS,
  ResourceType.SPLASH,
  | ImageResourceKey
  | ResourceKey.SRC
  | ResourceKey.ORIENTATION
  | ResourceKey.SCALE
>;

export type WindowsIconResourceConfig = BaseResourceConfig<
  Platform.WINDOWS,
  ResourceType.ICON,
  ImageResourceKey | ResourceKey.SRC | ResourceKey.TARGET | ResourceKey.SCALE
>;

export type WindowsSplashResourceConfig = BaseResourceConfig<
  Platform.WINDOWS,
  ResourceType.SPLASH,
  | ImageResourceKey
  | ResourceKey.SRC
  | ResourceKey.ORIENTATION
  | ResourceKey.TARGET
  | ResourceKey.SCALE
>;

export type SimpleResourceConfig =
  | AndroidIconResourceConfig
  | AndroidSplashResourceConfig
  | IOSIconResourceConfig
  | IOSSplashResourceConfig
  | WindowsIconResourceConfig
  | WindowsSplashResourceConfig;

export type ResourceConfig =
  | AndroidAdaptiveIconResourceConfig
  | SimpleResourceConfig;

export function validateResourceTypes(
  types: readonly string[],
): ResourceType[] {
  const result: ResourceType[] = [];

  for (const type of types) {
    if (!isSupportedResourceType(type)) {
      throw new BadInputError(`Unsupported resource type: ${type}`);
    }

    result.push(type);
  }

  return result;
}

export function isSupportedResourceType(type: any): type is ResourceType {
  return RESOURCE_TYPES.includes(type);
}

export function getSimpleResources(
  platform: Platform,
  type: ResourceType,
): readonly SimpleResourceConfig[] {
  switch (platform) {
    case Platform.ANDROID:
      switch (type) {
        case ResourceType.ICON:
          return ANDROID_ICON_RESOURCES;
        case ResourceType.SPLASH:
          return ANDROID_SPLASH_RESOURCES;
      }
      break;
    case Platform.IOS:
      switch (type) {
        case ResourceType.ICON:
          return IOS_ICON_RESOURCES;
        case ResourceType.SPLASH:
          return IOS_SPLASH_RESOURCES;
      }
      break;
    case Platform.WINDOWS:
      switch (type) {
        case ResourceType.ICON:
          return WINDOWS_ICON_RESOURCES;
        case ResourceType.SPLASH:
          return WINDOWS_SPLASH_RESOURCES;
      }
      break;
  }

  throw new BadInputError(
    `Unsupported platform/resource type combination: ${platform}/${type}`,
  );
}

export function generateScaledWindowsResourceSrc(
  src: string,
  factor: number,
): string {
  const { dir, name, ext } = pathlib.parse(src);

  return pathlib.posix.join(dir, `${name}.scale-${factor * 100}${ext}`);
}

export function generateScaledWindowsResource<
  T extends WindowsIconResourceConfig | WindowsSplashResourceConfig,
>(resource: T, factor: number): T {
  if (resource.scale !== 1) {
    throw new Error('Cannot generate scaled resource from scaled resource.');
  }

  return {
    ...resource,
    src: generateScaledWindowsResourceSrc(resource.src, factor),
    format: Format.PNG,
    target: undefined,
    width: Math.round(resource.width * factor),
    height: Math.round(resource.height * factor),
    scale: factor,
  };
}

export function generateScaledWindowsResources<
  T extends WindowsIconResourceConfig | WindowsSplashResourceConfig,
>(resource: T, factors: readonly number[]): T[] {
  return factors.map(factor => generateScaledWindowsResource(resource, factor));
}

/**
 * App Icon: App list in start menu, task bar, task manager
 */
export const WINDOWS_SQUARE_44_X_44_ICON: WindowsIconResourceConfig = {
  platform: Platform.WINDOWS,
  type: ResourceType.ICON,
  src: 'Square44x44Logo.png',
  format: Format.NONE,
  width: 44,
  height: 44,
  target: Target.SQUARE_44_X_44_LOGO,
  scale: 1,
};

/**
 * Small tile: Start menu
 */
export const WINDOWS_SQUARE_71_X_71_ICON: WindowsIconResourceConfig = {
  platform: Platform.WINDOWS,
  type: ResourceType.ICON,
  src: 'SmallTile.png',
  format: Format.NONE,
  width: 71,
  height: 71,
  target: Target.SQUARE_71_X_71_LOGO,
  scale: 1,
};

/**
 * Medium Tile: For Start menu, Microsoft Store listing
 */
export const WINDOWS_SQUARE_150_X_150_ICON: WindowsIconResourceConfig = {
  platform: Platform.WINDOWS,
  type: ResourceType.ICON,
  src: 'Square150x150Logo.png',
  format: Format.NONE,
  width: 150,
  height: 150,
  target: Target.SQUARE_150_X_150_LOGO,
  scale: 1,
};

/**
 * Large Tile: Start Menu
 */
export const WINDOWS_SQUARE_310_X_310_ICON: WindowsIconResourceConfig = {
  platform: Platform.WINDOWS,
  type: ResourceType.ICON,
  src: 'Square310x310Logo.png',
  format: Format.NONE,
  width: 310,
  height: 310,
  target: Target.SQUARE_310_X_310_LOGO,
  scale: 1,
};

/**
 * Wide Tile: Start Menu
 */
export const WINDOWS_WIDE_310_X_150_LOGO: WindowsIconResourceConfig = {
  platform: Platform.WINDOWS,
  type: ResourceType.ICON,
  src: 'Wide310x150Logo.png',
  format: Format.NONE,
  width: 310,
  height: 150,
  target: Target.WIDE_310_X_150_LOGO,
  scale: 1,
};

/**
 * Store Logo: App installer, Partner Center, the "Report an app" option in the Store, the "Write a review" option in the Store
 */
export const WINDOWS_STORE_LOGO: WindowsIconResourceConfig = {
  platform: Platform.WINDOWS,
  type: ResourceType.ICON,
  src: 'StoreLogo.png',
  format: Format.NONE,
  width: 50,
  height: 50,
  target: Target.STORE_LOGO,
  scale: 1,
};

/**
 * @see https://cordova.apache.org/docs/en/latest/config_ref/images.html#windows
 * @see https://docs.microsoft.com/en-us/windows/uwp/design/style/app-icons-and-logos
 * @see https://docs.microsoft.com/en-us/windows/uwp/design/style/app-icons-and-logos#icon-types-locations-and-scale-factors
 */
export const WINDOWS_ICON_RESOURCES: readonly WindowsIconResourceConfig[] = [
  WINDOWS_SQUARE_44_X_44_ICON,
  ...generateScaledWindowsResources(
    WINDOWS_SQUARE_44_X_44_ICON,
    [1, 1.25, 1.4, 1.5, 2, 2.4, 4],
  ),
  WINDOWS_SQUARE_71_X_71_ICON,
  ...generateScaledWindowsResources(
    WINDOWS_SQUARE_71_X_71_ICON,
    [1, 1.25, 1.4, 1.5, 2, 2.4, 4],
  ),
  WINDOWS_SQUARE_150_X_150_ICON,
  ...generateScaledWindowsResources(
    WINDOWS_SQUARE_150_X_150_ICON,
    [1, 1.25, 1.4, 1.5, 2, 2.4, 4],
  ),
  WINDOWS_SQUARE_310_X_310_ICON,
  ...generateScaledWindowsResources(
    WINDOWS_SQUARE_310_X_310_ICON,
    [1, 1.25, 1.4, 1.5, 1.8, 2, 4],
  ),
  WINDOWS_WIDE_310_X_150_LOGO,
  ...generateScaledWindowsResources(
    WINDOWS_WIDE_310_X_150_LOGO,
    [0.8, 1, 1.25, 1.4, 1.5, 1.8, 2, 2.4, 4],
  ),
  WINDOWS_STORE_LOGO,
  ...generateScaledWindowsResources(
    WINDOWS_STORE_LOGO,
    [1, 1.25, 1.4, 1.5, 1.8, 2, 2.4, 4],
  ),
];

export const WINDOWS_SPLASH_SCREEN: WindowsSplashResourceConfig = {
  platform: Platform.WINDOWS,
  type: ResourceType.SPLASH,
  src: 'Splash.png',
  format: Format.NONE,
  width: 620,
  height: 300,
  orientation: Orientation.LANDSCAPE,
  target: Target.SPLASH_SCREEN,
  scale: 1,
};

/**
 * @see https://msdn.microsoft.com/en-us/windows/desktop/hh465338
 * @see https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-splashscreen/index.html#windows-specific-information
 */
export const WINDOWS_SPLASH_RESOURCES: readonly WindowsSplashResourceConfig[] =
  [
    WINDOWS_SPLASH_SCREEN,
    ...generateScaledWindowsResources(
      WINDOWS_SPLASH_SCREEN,
      [1, 1.25, 1.5, 2, 4],
    ),
  ];

export const ANDROID_LDPI_ADAPTIVE_ICON: AndroidAdaptiveIconResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.ADAPTIVE_ICON,
  foreground: 'ldpi-foreground.png',
  background: 'ldpi-background.png',
  format: Format.PNG,
  width: 81,
  height: 81,
  density: Density.LDPI,
};

export const ANDROID_MDPI_ADAPTIVE_ICON: AndroidAdaptiveIconResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.ADAPTIVE_ICON,
  foreground: 'mdpi-foreground.png',
  background: 'mdpi-background.png',
  format: Format.PNG,
  width: 108,
  height: 108,
  density: Density.MDPI,
};

export const ANDROID_HDPI_ADAPTIVE_ICON: AndroidAdaptiveIconResourceConfig = {
  foreground: 'hdpi-foreground.png',
  platform: Platform.ANDROID,
  type: ResourceType.ADAPTIVE_ICON,
  background: 'hdpi-background.png',
  format: Format.PNG,
  width: 162,
  height: 162,
  density: Density.HDPI,
};

export const ANDROID_XHDPI_ADAPTIVE_ICON: AndroidAdaptiveIconResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.ADAPTIVE_ICON,
  foreground: 'xhdpi-foreground.png',
  background: 'xhdpi-background.png',
  format: Format.PNG,
  width: 216,
  height: 216,
  density: Density.XHDPI,
};

export const ANDROID_XXHDPI_ADAPTIVE_ICON: AndroidAdaptiveIconResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.ADAPTIVE_ICON,
  foreground: 'xxhdpi-foreground.png',
  background: 'xxhdpi-background.png',
  format: Format.PNG,
  width: 324,
  height: 324,
  density: Density.XXHDPI,
};

export const ANDROID_XXXHDPI_ADAPTIVE_ICON: AndroidAdaptiveIconResourceConfig =
  {
    platform: Platform.ANDROID,
    type: ResourceType.ADAPTIVE_ICON,
    foreground: 'xxxhdpi-foreground.png',
    background: 'xxxhdpi-background.png',
    format: Format.PNG,
    width: 432,
    height: 432,
    density: Density.XXXHDPI,
  };

export const ANDROID_ADAPTIVE_ICON_RESOURCES: readonly AndroidAdaptiveIconResourceConfig[] =
  [
    ANDROID_LDPI_ADAPTIVE_ICON,
    ANDROID_MDPI_ADAPTIVE_ICON,
    ANDROID_HDPI_ADAPTIVE_ICON,
    ANDROID_XHDPI_ADAPTIVE_ICON,
    ANDROID_XXHDPI_ADAPTIVE_ICON,
    ANDROID_XXXHDPI_ADAPTIVE_ICON,
  ];

export const ANDROID_LDPI_ICON: AndroidIconResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.ICON,
  src: 'drawable-ldpi-icon.png',
  format: Format.PNG,
  width: 36,
  height: 36,
  density: Density.LDPI,
};

export const ANDROID_MDPI_ICON: AndroidIconResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.ICON,
  src: 'drawable-mdpi-icon.png',
  format: Format.PNG,
  width: 48,
  height: 48,
  density: Density.MDPI,
};

export const ANDROID_HDPI_ICON: AndroidIconResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.ICON,
  src: 'drawable-hdpi-icon.png',
  format: Format.PNG,
  width: 72,
  height: 72,
  density: Density.HDPI,
};

export const ANDROID_XHDPI_ICON: AndroidIconResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.ICON,
  src: 'drawable-xhdpi-icon.png',
  format: Format.PNG,
  width: 96,
  height: 96,
  density: Density.XHDPI,
};

export const ANDROID_XXHDPI_ICON: AndroidIconResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.ICON,
  src: 'drawable-xxhdpi-icon.png',
  format: Format.PNG,
  width: 144,
  height: 144,
  density: Density.XXHDPI,
};

export const ANDROID_XXXHDPI_ICON: AndroidIconResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.ICON,
  src: 'drawable-xxxhdpi-icon.png',
  format: Format.PNG,
  width: 192,
  height: 192,
  density: Density.XXXHDPI,
};

export const ANDROID_ICON_RESOURCES: readonly AndroidIconResourceConfig[] = [
  ANDROID_LDPI_ICON,
  ANDROID_MDPI_ICON,
  ANDROID_HDPI_ICON,
  ANDROID_XHDPI_ICON,
  ANDROID_XXHDPI_ICON,
  ANDROID_XXXHDPI_ICON,
];

export const ANDROID_LAND_LDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-land-ldpi-screen.png',
  format: Format.PNG,
  width: 320,
  height: 240,
  density: Density.LAND_LDPI,
  orientation: Orientation.LANDSCAPE,
};

export const ANDROID_LAND_MDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-land-mdpi-screen.png',
  format: Format.PNG,
  width: 480,
  height: 320,
  density: Density.LAND_MDPI,
  orientation: Orientation.LANDSCAPE,
};

export const ANDROID_LAND_HDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-land-hdpi-screen.png',
  format: Format.PNG,
  width: 800,
  height: 480,
  density: Density.LAND_HDPI,
  orientation: Orientation.LANDSCAPE,
};

export const ANDROID_LAND_XHDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-land-xhdpi-screen.png',
  format: Format.PNG,
  width: 1280,
  height: 720,
  density: Density.LAND_XHDPI,
  orientation: Orientation.LANDSCAPE,
};

export const ANDROID_LAND_XXHDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-land-xxhdpi-screen.png',
  format: Format.PNG,
  width: 1600,
  height: 960,
  density: Density.LAND_XXHDPI,
  orientation: Orientation.LANDSCAPE,
};

export const ANDROID_LAND_XXXHDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-land-xxxhdpi-screen.png',
  format: Format.PNG,
  width: 1920,
  height: 1280,
  density: Density.LAND_XXXHDPI,
  orientation: Orientation.LANDSCAPE,
};

export const ANDROID_PORT_LDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-port-ldpi-screen.png',
  format: Format.PNG,
  width: 240,
  height: 320,
  density: Density.PORT_LDPI,
  orientation: Orientation.PORTRAIT,
};

export const ANDROID_PORT_MDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-port-mdpi-screen.png',
  format: Format.PNG,
  width: 320,
  height: 480,
  density: Density.PORT_MDPI,
  orientation: Orientation.PORTRAIT,
};

export const ANDROID_PORT_HDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-port-hdpi-screen.png',
  format: Format.PNG,
  width: 480,
  height: 800,
  density: Density.PORT_HDPI,
  orientation: Orientation.PORTRAIT,
};

export const ANDROID_PORT_XHDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-port-xhdpi-screen.png',
  format: Format.PNG,
  width: 720,
  height: 1280,
  density: Density.PORT_XHDPI,
  orientation: Orientation.PORTRAIT,
};

export const ANDROID_PORT_XXHDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-port-xxhdpi-screen.png',
  format: Format.PNG,
  width: 960,
  height: 1600,
  density: Density.PORT_XXHDPI,
  orientation: Orientation.PORTRAIT,
};

export const ANDROID_PORT_XXXHDPI_SCREEN: AndroidSplashResourceConfig = {
  platform: Platform.ANDROID,
  type: ResourceType.SPLASH,
  src: 'drawable-port-xxxhdpi-screen.png',
  format: Format.PNG,
  width: 1280,
  height: 1920,
  density: Density.PORT_XXXHDPI,
  orientation: Orientation.PORTRAIT,
};

export const ANDROID_SPLASH_RESOURCES: readonly AndroidSplashResourceConfig[] =
  [
    ANDROID_LAND_LDPI_SCREEN,
    ANDROID_LAND_MDPI_SCREEN,
    ANDROID_LAND_HDPI_SCREEN,
    ANDROID_LAND_XHDPI_SCREEN,
    ANDROID_LAND_XXHDPI_SCREEN,
    ANDROID_LAND_XXXHDPI_SCREEN,
    ANDROID_PORT_LDPI_SCREEN,
    ANDROID_PORT_MDPI_SCREEN,
    ANDROID_PORT_HDPI_SCREEN,
    ANDROID_PORT_XHDPI_SCREEN,
    ANDROID_PORT_XXHDPI_SCREEN,
    ANDROID_PORT_XXXHDPI_SCREEN,
  ];

/**
 * 20pt Icon
 *
 * - iPhone Notification (iOS 7+)
 * - iPad Notification (iOS 7+)
 */
export const IOS_20_PT_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-20.png',
  format: Format.PNG,
  width: 20,
  height: 20,
  scale: 1,
};

export const IOS_20_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-20@2x.png',
  format: Format.PNG,
  width: 40,
  height: 40,
  scale: 2,
};

export const IOS_20_PT_3X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-20@3x.png',
  format: Format.PNG,
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
export const IOS_29_PT_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-29.png',
  format: Format.PNG,
  width: 29,
  height: 29,
  scale: 1,
};

export const IOS_29_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-29@2x.png',
  format: Format.PNG,
  width: 58,
  height: 58,
  scale: 2,
};

export const IOS_29_PT_3X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-29@3x.png',
  format: Format.PNG,
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
export const IOS_40_PT_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-40.png',
  format: Format.PNG,
  width: 40,
  height: 40,
  scale: 1,
};

export const IOS_40_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-40@2x.png',
  format: Format.PNG,
  width: 80,
  height: 80,
  scale: 2,
};

export const IOS_40_PT_3X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-40@3x.png',
  format: Format.PNG,
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
export const IOS_50_PT_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-50.png',
  format: Format.PNG,
  width: 50,
  height: 50,
  scale: 1,
};

export const IOS_50_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-50@2x.png',
  format: Format.PNG,
  width: 100,
  height: 100,
  scale: 2,
};

/**
 * 57pt Icon
 *
 * - iPhone App (iOS 5,6)
 */
export const IOS_57_PT_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon.png',
  format: Format.PNG,
  width: 57,
  height: 57,
  scale: 1,
};

export const IOS_57_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon@2x.png',
  format: Format.PNG,
  width: 114,
  height: 114,
  scale: 2,
};

/**
 * 60pt Icon
 *
 * - iPhone App (iOS 7+)
 */
export const IOS_60_PT_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-60.png',
  format: Format.PNG,
  width: 60,
  height: 60,
  scale: 1,
};

export const IOS_60_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-60@2x.png',
  format: Format.PNG,
  width: 120,
  height: 120,
  scale: 2,
};

export const IOS_60_PT_3X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-60@3x.png',
  format: Format.PNG,
  width: 180,
  height: 180,
  scale: 3,
};

/**
 * 72pt Icon
 *
 * - iPad App (iOS 5,6)
 */
export const IOS_72_PT_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-72.png',
  format: Format.PNG,
  width: 72,
  height: 72,
  scale: 1,
};

export const IOS_72_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-72@2x.png',
  format: Format.PNG,
  width: 144,
  height: 144,
  scale: 2,
};

/**
 * 76pt Icon
 *
 * - iPad App (iOS 7+)
 */
export const IOS_76_PT_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-76.png',
  format: Format.PNG,
  width: 76,
  height: 76,
  scale: 1,
};

export const IOS_76_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-76@2x.png',
  format: Format.PNG,
  width: 152,
  height: 152,
  scale: 2,
};

/**
 * 83.5pt Icon
 *
 * iPad Pro (12.9-inch)
 */
export const IOS_83_5_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-83.5@2x.png',
  format: Format.PNG,
  width: 167,
  height: 167,
  scale: 2,
};

/**
 * 1024px Icon
 *
 * - App Store
 */
export const IOS_1024_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-1024.png',
  format: Format.PNG,
  width: 1024,
  height: 1024,
  scale: 1,
};

/**
 * 24pt Icon
 *
 * - Apple Watch Notification Center
 */
export const IOS_24_PT_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-24@2x.png',
  format: Format.PNG,
  width: 48,
  height: 48,
  scale: 2,
};

/**
 * 27.5pt Icon
 *
 * - Apple Watch Notification Center
 */
export const IOS_27_5_PT_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-27.5@2x.png',
  format: Format.PNG,
  width: 55,
  height: 55,
  scale: 2,
};

/**
 * 44pt Icon
 *
 * - Apple Watch Home Screen
 */
export const IOS_44_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-44@2x.png',
  format: Format.PNG,
  width: 88,
  height: 88,
  scale: 2,
};

/**
 * 86pt Icon
 *
 * - Apple Watch Short Look
 */
export const IOS_86_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-86@2x.png',
  format: Format.PNG,
  width: 172,
  height: 172,
  scale: 2,
};

/**
 * 98pt Icon
 *
 * - Apple Watch Short Look
 */
export const IOS_98_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-98@2x.png',
  format: Format.PNG,
  width: 196,
  height: 196,
  scale: 2,
};

/**
 * 108pt Icon
 *
 * - Apple Watch Short Look
 */
export const IOS_108_PT_2X_ICON: IOSIconResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.ICON,
  src: 'icon-108@2x.png',
  format: Format.PNG,
  width: 216,
  height: 216,
  scale: 2,
};

export const IOS_ICON_RESOURCES: readonly IOSIconResourceConfig[] = [
  IOS_57_PT_ICON,
  IOS_57_PT_2X_ICON,
  IOS_20_PT_ICON,
  IOS_20_PT_2X_ICON,
  IOS_20_PT_3X_ICON,
  IOS_29_PT_ICON,
  IOS_29_PT_2X_ICON,
  IOS_29_PT_3X_ICON,
  IOS_24_PT_ICON,
  IOS_27_5_PT_ICON,
  IOS_44_PT_2X_ICON,
  IOS_86_PT_2X_ICON,
  IOS_98_PT_2X_ICON,
  IOS_108_PT_2X_ICON,
  IOS_40_PT_ICON,
  IOS_40_PT_2X_ICON,
  IOS_40_PT_3X_ICON,
  IOS_50_PT_ICON,
  IOS_50_PT_2X_ICON,
  IOS_60_PT_ICON,
  IOS_60_PT_2X_ICON,
  IOS_60_PT_3X_ICON,
  IOS_72_PT_ICON,
  IOS_72_PT_2X_ICON,
  IOS_76_PT_ICON,
  IOS_76_PT_2X_ICON,
  IOS_83_5_PT_2X_ICON,
  IOS_1024_ICON,
];

export const IOS_568H_2X_IPHONE_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-568h@2x~iphone.png',
  format: Format.PNG,
  width: 640,
  height: 1136,
  orientation: Orientation.PORTRAIT,
  scale: 2,
};

export const IOS_667H_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-667h.png',
  format: Format.PNG,
  width: 750,
  height: 1334,
  orientation: Orientation.PORTRAIT,
  scale: 1,
};

export const IOS_2688H_IPHONE_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-2688h~iphone.png',
  format: Format.PNG,
  width: 1242,
  height: 2688,
  orientation: Orientation.PORTRAIT,
  scale: 1,
};

export const IOS_2688H_LANDSCAPE_IPHONE_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-Landscape-2688h~iphone.png',
  format: Format.PNG,
  width: 2688,
  height: 1242,
  orientation: Orientation.LANDSCAPE,
  scale: 1,
};

export const IOS_1792H_IPHONE_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-1792h~iphone.png',
  format: Format.PNG,
  width: 828,
  height: 1792,
  orientation: Orientation.PORTRAIT,
  scale: 1,
};

export const IOS_1792H_LANDSCAPE_IPHONE_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-Landscape-1792h~iphone.png',
  format: Format.PNG,
  width: 1792,
  height: 828,
  orientation: Orientation.LANDSCAPE,
  scale: 1,
};

export const IOS_2436H_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-2436h.png',
  format: Format.PNG,
  width: 1125,
  height: 2436,
  orientation: Orientation.PORTRAIT,
  scale: 1,
};

export const IOS_2436H_LANDSCAPE_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-Landscape-2436h.png',
  format: Format.PNG,
  width: 2436,
  height: 1125,
  orientation: Orientation.LANDSCAPE,
  scale: 1,
};

export const IOS_736H_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-736h.png',
  format: Format.PNG,
  width: 1242,
  height: 2208,
  orientation: Orientation.PORTRAIT,
  scale: 1,
};

export const IOS_736H_LANDSCAPE_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-Landscape-736h.png',
  format: Format.PNG,
  width: 2208,
  height: 1242,
  orientation: Orientation.LANDSCAPE,
  scale: 1,
};

export const IOS_LANDSCAPE_2X_IPAD_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-Landscape@2x~ipad.png',
  format: Format.PNG,
  width: 2048,
  height: 1536,
  orientation: Orientation.LANDSCAPE,
  scale: 2,
};

export const IOS_LANDSCAPE_IPADPRO_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-Landscape@~ipadpro.png',
  format: Format.PNG,
  width: 2732,
  height: 2048,
  orientation: Orientation.LANDSCAPE,
  scale: 1,
};

export const IOS_LANDSCAPE_IPAD_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-Landscape~ipad.png',
  format: Format.PNG,
  width: 1024,
  height: 768,
  orientation: Orientation.LANDSCAPE,
  scale: 1,
};

export const IOS_PORTRAIT_2X_IPAD_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-Portrait@2x~ipad.png',
  format: Format.PNG,
  width: 1536,
  height: 2048,
  orientation: Orientation.PORTRAIT,
  scale: 2,
};

export const IOS_PORTRAIT_IPADPRO_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-Portrait@~ipadpro.png',
  format: Format.PNG,
  width: 2048,
  height: 2732,
  orientation: Orientation.PORTRAIT,
  scale: 1,
};

export const IOS_PORTRAIT_IPAD_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default-Portrait~ipad.png',
  format: Format.PNG,
  width: 768,
  height: 1024,
  orientation: Orientation.PORTRAIT,
  scale: 1,
};

export const IOS_2X_IPHONE_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default@2x~iphone.png',
  format: Format.PNG,
  width: 640,
  height: 960,
  orientation: Orientation.PORTRAIT,
  scale: 2,
};

export const IOS_IPHONE_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default~iphone.png',
  format: Format.PNG,
  width: 320,
  height: 480,
  orientation: Orientation.PORTRAIT,
  scale: 1,
};

export const IOS_2X_UNIVERSAL_ANYANY_SPLASH: IOSSplashResourceConfig = {
  platform: Platform.IOS,
  type: ResourceType.SPLASH,
  src: 'Default@2x~universal~anyany.png',
  format: Format.PNG,
  width: 2732,
  height: 2732,
  orientation: Orientation.PORTRAIT,
  scale: 2,
};

export const IOS_SPLASH_RESOURCES: readonly IOSSplashResourceConfig[] = [
  IOS_568H_2X_IPHONE_SPLASH,
  IOS_667H_SPLASH,
  IOS_2688H_IPHONE_SPLASH,
  IOS_2688H_LANDSCAPE_IPHONE_SPLASH,
  IOS_1792H_IPHONE_SPLASH,
  IOS_1792H_LANDSCAPE_IPHONE_SPLASH,
  IOS_2436H_SPLASH,
  IOS_2436H_LANDSCAPE_SPLASH,
  IOS_736H_SPLASH,
  IOS_736H_LANDSCAPE_SPLASH,
  IOS_LANDSCAPE_2X_IPAD_SPLASH,
  IOS_LANDSCAPE_IPADPRO_SPLASH,
  IOS_LANDSCAPE_IPAD_SPLASH,
  IOS_PORTRAIT_2X_IPAD_SPLASH,
  IOS_PORTRAIT_IPADPRO_SPLASH,
  IOS_PORTRAIT_IPAD_SPLASH,
  IOS_2X_IPHONE_SPLASH,
  IOS_IPHONE_SPLASH,
  IOS_2X_UNIVERSAL_ANYANY_SPLASH,
];
