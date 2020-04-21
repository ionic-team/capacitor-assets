import pathlib from 'path';
import { Metadata, Sharp } from 'sharp';
import util from 'util';

import { BadInputError, ValidationError, ValidationErrorCode } from './error';
import { Platform, prettyPlatform } from './platform';

export const DEFAULT_RESOURCES_DIRECTORY = 'resources';

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
export const RESOURCE_RASTER_FORMATS: readonly Format[] = [Format.JPEG, Format.PNG];

export function isResourceFormat(format: any): format is Format {
  return RESOURCE_FORMATS.includes(format);
}

export function isRasterResourceFormat(format: any): format is Format {
  return RESOURCE_RASTER_FORMATS.includes(format);
}

export interface RasterResourceSchema {
  width: number;
  height: number;
}

export async function validateRasterResource(platform: Platform, type: ResourceType, source: string, metadata: Metadata, schema: RasterResourceSchema): Promise<void> {
  const { format, width, height } = metadata;
  const { width: requiredWidth, height: requiredHeight } = schema;

  if (!format || !isRasterResourceFormat(format)) {
    throw new ValidationError(`The format for source image of type "${type}" must be one of: (${RESOURCE_RASTER_FORMATS.join(', ')}) (image format is "${format}").`, {
      source,
      type,
      code: ValidationErrorCode.BAD_IMAGE_FORMAT,
      format,
      requiredFormats: RESOURCE_RASTER_FORMATS,
    });
  }

  if (!width || !height || width < requiredWidth || height < requiredHeight) {
    throw new ValidationError(`The dimensions for source image of type "${type}" do not meet minimum size requirements: ${requiredWidth}x${requiredHeight} (image is ${width}x${height}).`, {
      source,
      type,
      code: ValidationErrorCode.BAD_IMAGE_SIZE,
      width,
      height,
      requiredWidth,
      requiredHeight,
    });
  }
}

export const COLOR_REGEX = /^\#[A-F0-9]{6}$/;

export function getRasterResourceSchema(platform: Platform, type: ResourceType): RasterResourceSchema {
  switch (type) {
    case ResourceType.ADAPTIVE_ICON:
      return { width: 432, height: 432 };
    case ResourceType.ICON:
      return { width: 1024, height: 1024 };
    case ResourceType.SPLASH:
      return { width: 2732, height: 2732 };
  }
}

export async function validateResource(platform: Platform, type: ResourceType, source: string, pipeline: Sharp, errstream: NodeJS.WritableStream | null): Promise<Metadata> {
  const metadata = await pipeline.metadata();

  const schema = getRasterResourceSchema(platform, type);
  await validateRasterResource(platform, type, source, metadata, schema);

  if (platform === Platform.IOS && type === ResourceType.ICON) {
    if (metadata.hasAlpha) {
      // @see https://github.com/ionic-team/cordova-res/issues/94
      errstream?.write(util.format(
        (
          'WARN:\tSource icon %s contains alpha channel, generated icons for %s will not.\n\n' +
          '\tApple recommends avoiding transparency. See the App Icon Human Interface Guidelines[1] for details. Any transparency in your icon will be filled in with white.\n\n' +
          '\t[1]: https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/\n'
        ),
        source,
        prettyPlatform(platform)
      ) + '\n');
    }
  }

  return metadata;
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

export const enum ResourceKey {
  SRC = 'src',
  FOREGROUND = 'foreground',
  BACKGROUND = 'background',
  FORMAT = 'format',
  WIDTH = 'width',
  HEIGHT = 'height',
  DENSITY = 'density',
  ORIENTATION = 'orientation',
  TARGET = 'target',
}

export interface ResourceKeyValues {
  readonly [ResourceKey.SRC]?: string;
  readonly [ResourceKey.FOREGROUND]?: string;
  readonly [ResourceKey.BACKGROUND]?: string;
  readonly [ResourceKey.FORMAT]?: Format;
  readonly [ResourceKey.WIDTH]?: number;
  readonly [ResourceKey.HEIGHT]?: number;
  readonly [ResourceKey.DENSITY]?: Density;
  readonly [ResourceKey.ORIENTATION]?: Orientation;
  readonly [ResourceKey.TARGET]?: string;
}

export type ImageResourceConfig = Required<Pick<ResourceKeyValues, ResourceKey.FORMAT | ResourceKey.WIDTH | ResourceKey.HEIGHT>>;
export type AndroidAdaptiveIconConfig = ImageResourceConfig & Required<Pick<ResourceKeyValues, ResourceKey.FOREGROUND | ResourceKey.BACKGROUND | ResourceKey.DENSITY>>;
export type AndroidIconConfig = ImageResourceConfig & Required<Pick<ResourceKeyValues, ResourceKey.SRC | ResourceKey.DENSITY>>;
export type AndroidSplashConfig = ImageResourceConfig & Required<Pick<ResourceKeyValues, ResourceKey.SRC | ResourceKey.FORMAT | ResourceKey.WIDTH | ResourceKey.HEIGHT | ResourceKey.DENSITY | ResourceKey.ORIENTATION>>;
export type IOSIconConfig = ImageResourceConfig & Required<Pick<ResourceKeyValues, ResourceKey.SRC>>;
export type IOSSplashConfig = ImageResourceConfig & Required<Pick<ResourceKeyValues, ResourceKey.SRC | ResourceKey.ORIENTATION>>;

export type WindowsIconConfig = (
  Required<Pick<ResourceKeyValues, ResourceKey.SRC | ResourceKey.FORMAT | ResourceKey.WIDTH | ResourceKey.HEIGHT>> &
  Pick<ResourceKeyValues, ResourceKey.TARGET>
);

export type WindowsSplashConfig = (
  Required<Pick<ResourceKeyValues, ResourceKey.SRC | ResourceKey.FORMAT | ResourceKey.WIDTH | ResourceKey.HEIGHT | ResourceKey.ORIENTATION>> &
  Pick<ResourceKeyValues, ResourceKey.TARGET>
);

export const enum ResourceNodeAttributeType {
  PATH = 'path',
}

export interface ResourceNodeAttribute {
  readonly key: ResourceKey;
  readonly type?: ResourceNodeAttributeType;
}

/**
 * Metadata for Cordova's config.xml
 */
export interface ResourcesTypeConfigXml {
  /**
   * XML node name of this resource (e.g. 'icon', 'splash')
   */
  readonly nodeName: string;

  /**
   * An array of resource keys to copy into the XML node as attributes
   */
  readonly nodeAttributes: readonly ResourceNodeAttribute[];

  /**
   * Get the XPath expression(s) for a resource
   *
   * This function is used to look up existing nodes in the XML. This is
   * important because nodes need to be replaced if found.
   */
  readonly xpaths: (resource: ResourceKeyValues) => string[];

  /**
   * Get whether a resource should be included in the XML or not
   */
  readonly included: (resource: ResourceKeyValues) => boolean;
}

export interface ResourcesTypeConfig<C extends ResourceKeyValues> {
  readonly resources: readonly C[];
  readonly configXml: ResourcesTypeConfigXml;
}

export function validateResourceTypes(types: readonly string[]): ResourceType[] {
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

const NodeAttributes = {
  FOREGROUND: { key: ResourceKey.FOREGROUND, type: ResourceNodeAttributeType.PATH },
  BACKGROUND: { key: ResourceKey.BACKGROUND, type: ResourceNodeAttributeType.PATH },
  SRC: { key: ResourceKey.SRC, type: ResourceNodeAttributeType.PATH },
  DENSITY: { key: ResourceKey.DENSITY },
  WIDTH: { key: ResourceKey.WIDTH },
  HEIGHT: { key: ResourceKey.HEIGHT },
  TARGET: { key: ResourceKey.TARGET },
} as const;

export function getResourcesConfig(platform: Platform.ANDROID, type: ResourceType.ADAPTIVE_ICON): ResourcesTypeConfig<AndroidAdaptiveIconConfig>;
export function getResourcesConfig(platform: Platform.ANDROID | Platform.IOS | Platform.WINDOWS, type: ResourceType.ICON | ResourceType.SPLASH): ResourcesTypeConfig<AndroidIconConfig | AndroidSplashConfig | IOSIconConfig | IOSSplashConfig | WindowsIconConfig | WindowsSplashConfig>;
export function getResourcesConfig(platform: Platform, type: ResourceType): ResourcesTypeConfig<ResourceKeyValues> {
  switch (platform) {
    case Platform.ANDROID:
      switch (type) {
        case ResourceType.ADAPTIVE_ICON:
          return ANDROID_ADAPTIVE_ICON_RESOURCES_CONFIG;
        case ResourceType.ICON:
          return ANDROID_ICON_RESOURCES_CONFIG;
        case ResourceType.SPLASH:
          return ANDROID_SPLASH_RESOURCES_CONFIG;
      }
    case Platform.IOS:
      switch (type) {
        case ResourceType.ICON:
          return IOS_ICON_RESOURCES_CONFIG;
        case ResourceType.SPLASH:
          return IOS_SPLASH_RESOURCES_CONFIG;
      }
      break;
    case Platform.WINDOWS:
      switch (type) {
        case ResourceType.ICON:
          return WINDOWS_ICON_RESOURCES_CONFIG;
        case ResourceType.SPLASH:
          return WINDOWS_SPLASH_RESOURCES_CONFIG;
      }
      break;
  }

  throw new BadInputError(`Unsupported platform/resource type combination: ${platform}/${type}`);
}

export function xpathsForPathAttribute(nodeName: string, attr: ResourceKey) {
  return function xpaths(resource: ResourceKeyValues): string[] {
    const path = resource[attr];

    if (typeof path !== 'string') {
      return [];
    }

    return [
      `${nodeName}[@${attr}='${path}']`,
      `${nodeName}[@${attr}='${path.replace(/\//g, '\\')}']`, // Check for XML paths that use backslashes
    ];
  };
}

export function generateScaledWindowsResourceSrc(src: string, factor: number): string {
  const { dir, name, ext } = pathlib.parse(src);

  return pathlib.posix.join(dir, `${name}.scale-${factor * 100}${ext}`);
}

export function generateScaledWindowsResource<T extends WindowsIconConfig | WindowsSplashConfig>(resource: T, factor: number): T {
  return {
    ...resource,
    src: generateScaledWindowsResourceSrc(resource.src, factor),
    format: Format.PNG,
    target: undefined,
    width: Math.round(resource.width * factor),
    height: Math.round(resource.height * factor),
  };
}

export function generateScaledWindowsResources<T extends WindowsIconConfig | WindowsSplashConfig>(resource: T, factors: readonly number[]): T[] {
  return factors.map(factor => generateScaledWindowsResource(resource, factor));
}

/**
 * App Icon: App list in start menu, task bar, task manager
 */
const WINDOWS_SQUARE_44_X_44_ICON = { src: 'windows/icon/Square44x44Logo.png', format: Format.NONE, width: 44, height: 44, target: Target.SQUARE_44_X_44_LOGO } as const;

/**
 * Small tile: Start menu
 */
const WINDOWS_SQUARE_71_X_71_ICON = { src: 'windows/icon/SmallTile.png', format: Format.NONE, width: 71, height: 71, target: Target.SQUARE_71_X_71_LOGO } as const;

/**
 * Medium Tile: For Start menu, Microsoft Store listing
 */
const WINDOWS_SQUARE_150_X_150_ICON = { src: 'windows/icon/Square150x150Logo.png', format: Format.NONE, width: 150, height: 150, target: Target.SQUARE_150_X_150_LOGO } as const;

/**
 * Large Tile: Start Menu
 */
const WINDOWS_SQUARE_310_X_310_ICON = { src: 'windows/icon/Square310x310Logo.png', format: Format.NONE, width: 310, height: 310, target: Target.SQUARE_310_X_310_LOGO } as const;

/**
 * Wide Tile: Start Menu
 */
const WINDOWS_WIDE_310_X_150_LOGO = { src: 'windows/icon/Wide310x150Logo.png', format: Format.NONE, width: 310, height : 150, target: Target.WIDE_310_X_150_LOGO } as const;

/**
 * Store Logo: App installer, Partner Center, the "Report an app" option in the Store, the "Write a review" option in the Store
 */
const WINDOWS_STORE_LOGO = { src: 'windows/icon/StoreLogo.png', format: Format.NONE, width: 50, height: 50, target: Target.STORE_LOGO } as const;

const WINDOWS_SPLASH_SCREEN = { src: 'windows/splash/Splash.png', format: Format.NONE, width: 620, height: 300, orientation: Orientation.LANDSCAPE, target: Target.SPLASH_SCREEN } as const;

/**
 * @see https://cordova.apache.org/docs/en/latest/config_ref/images.html#windows
 * @see https://docs.microsoft.com/en-us/windows/uwp/design/style/app-icons-and-logos
 * @see https://docs.microsoft.com/en-us/windows/uwp/design/style/app-icons-and-logos#icon-types-locations-and-scale-factors
 */
const WINDOWS_ICON_RESOURCES_CONFIG: ResourcesTypeConfig<WindowsIconConfig> = {
  resources: [
    WINDOWS_SQUARE_44_X_44_ICON,
    ...generateScaledWindowsResources(WINDOWS_SQUARE_44_X_44_ICON, [1, 1.25, 1.4, 1.5, 2, 2.4, 4]),
    WINDOWS_SQUARE_71_X_71_ICON,
    ...generateScaledWindowsResources(WINDOWS_SQUARE_71_X_71_ICON, [1, 1.25, 1.4, 1.5, 2, 2.4, 4]),
    WINDOWS_SQUARE_150_X_150_ICON,
    ...generateScaledWindowsResources(WINDOWS_SQUARE_150_X_150_ICON, [1, 1.25, 1.4, 1.5, 2, 2.4, 4]),
    WINDOWS_SQUARE_310_X_310_ICON,
    ...generateScaledWindowsResources(WINDOWS_SQUARE_310_X_310_ICON, [1, 1.25, 1.4, 1.5, 1.8, 2, 4]),
    WINDOWS_WIDE_310_X_150_LOGO,
    ...generateScaledWindowsResources(WINDOWS_WIDE_310_X_150_LOGO, [0.8, 1, 1.25, 1.4, 1.5, 1.8, 2, 2.4, 4]),
    WINDOWS_STORE_LOGO,
    ...generateScaledWindowsResources(WINDOWS_STORE_LOGO, [1, 1.25, 1.4, 1.5, 1.8, 2, 2.4, 4]),
  ],
  configXml: {
    nodeName: 'icon',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.TARGET],
    xpaths: xpathsForPathAttribute('icon', NodeAttributes.SRC.key),
    included: resource => !!resource.target,
  },
};

/**
 * @see https://msdn.microsoft.com/en-us/windows/desktop/hh465338
 * @see https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-splashscreen/index.html#windows-specific-information
 */
const WINDOWS_SPLASH_RESOURCES_CONFIG: ResourcesTypeConfig<WindowsSplashConfig> = {
  resources: [
    WINDOWS_SPLASH_SCREEN,
    ...generateScaledWindowsResources(WINDOWS_SPLASH_SCREEN, [1, 1.25, 1.5, 2, 4]),
  ],
  configXml: {
    nodeName: 'splash',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.TARGET],
    xpaths: xpathsForPathAttribute('splash', NodeAttributes.SRC.key),
    included: resource => !!resource.target,
  },
};

const ANDROID_LDPI_ADAPTIVE_ICON = { foreground: 'android/icon/ldpi-foreground.png', background: 'android/icon/ldpi-background.png', format: Format.PNG, width: 81, height: 81, density: Density.LDPI } as const;
const ANDROID_MDPI_ADAPTIVE_ICON = { foreground: 'android/icon/mdpi-foreground.png', background: 'android/icon/mdpi-background.png', format: Format.PNG, width: 108, height: 108, density: Density.MDPI } as const;
const ANDROID_HDPI_ADAPTIVE_ICON = { foreground: 'android/icon/hdpi-foreground.png', background: 'android/icon/hdpi-background.png', format: Format.PNG, width: 162, height: 162, density: Density.HDPI } as const;
const ANDROID_XHDPI_ADAPTIVE_ICON = { foreground: 'android/icon/xhdpi-foreground.png', background: 'android/icon/xhdpi-background.png', format: Format.PNG, width: 216, height: 216, density: Density.XHDPI } as const;
const ANDROID_XXHDPI_ADAPTIVE_ICON = { foreground: 'android/icon/xxhdpi-foreground.png', background: 'android/icon/xxhdpi-background.png', format: Format.PNG, width: 324, height: 324, density: Density.XXHDPI } as const;
const ANDROID_XXXHDPI_ADAPTIVE_ICON = { foreground: 'android/icon/xxxhdpi-foreground.png', background: 'android/icon/xxxhdpi-background.png', format: Format.PNG, width: 432, height: 432, density: Density.XXXHDPI } as const;

const ANDROID_ADAPTIVE_ICON_RESOURCES = [
  ANDROID_LDPI_ADAPTIVE_ICON,
  ANDROID_MDPI_ADAPTIVE_ICON,
  ANDROID_HDPI_ADAPTIVE_ICON,
  ANDROID_XHDPI_ADAPTIVE_ICON,
  ANDROID_XXHDPI_ADAPTIVE_ICON,
  ANDROID_XXXHDPI_ADAPTIVE_ICON,
] as const;

const ANDROID_ADAPTIVE_ICON_RESOURCES_CONFIG: ResourcesTypeConfig<AndroidAdaptiveIconConfig> = {
  resources: ANDROID_ADAPTIVE_ICON_RESOURCES,
  configXml: {
    nodeName: 'icon',
    nodeAttributes: [NodeAttributes.FOREGROUND, NodeAttributes.DENSITY, NodeAttributes.BACKGROUND],
    xpaths: resource => [`icon[@foreground][@background][@density='${resource.density}']`],
    included: resource => ANDROID_ADAPTIVE_ICON_RESOURCES.map(r => `${r.density}`).includes(`${resource.density}`),
  },
};

const ANDROID_LDPI_ICON = { src: 'android/icon/drawable-ldpi-icon.png', format: Format.PNG, width: 36, height: 36, density: Density.LDPI } as const;
const ANDROID_MDPI_ICON = { src: 'android/icon/drawable-mdpi-icon.png', format: Format.PNG, width: 48, height: 48, density: Density.MDPI } as const;
const ANDROID_HDPI_ICON = { src: 'android/icon/drawable-hdpi-icon.png', format: Format.PNG, width: 72, height: 72, density: Density.HDPI } as const;
const ANDROID_XHDPI_ICON = { src: 'android/icon/drawable-xhdpi-icon.png', format: Format.PNG, width: 96, height: 96, density: Density.XHDPI } as const;
const ANDROID_XXHDPI_ICON = { src: 'android/icon/drawable-xxhdpi-icon.png', format: Format.PNG, width: 144, height: 144, density: Density.XXHDPI } as const;
const ANDROID_XXXHDPI_ICON = { src: 'android/icon/drawable-xxxhdpi-icon.png', format: Format.PNG, width: 192, height: 192, density: Density.XXXHDPI } as const;

const ANDROID_ICON_RESOURCES = [
  ANDROID_LDPI_ICON,
  ANDROID_MDPI_ICON,
  ANDROID_HDPI_ICON,
  ANDROID_XHDPI_ICON,
  ANDROID_XXHDPI_ICON,
  ANDROID_XXXHDPI_ICON,
] as const;

const ANDROID_ICON_RESOURCES_CONFIG: ResourcesTypeConfig<AndroidIconConfig> = {
  resources: ANDROID_ICON_RESOURCES,
  configXml: {
    nodeName: 'icon',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.DENSITY],
    xpaths: resource => [`icon[@src][@density='${resource.density}']`],
    included: () => true,
  },
};

const ANDROID_LAND_LDPI_SCREEN = { src: 'android/splash/drawable-land-ldpi-screen.png', format: Format.PNG, width: 320, height: 240, density: Density.LAND_LDPI, orientation: Orientation.LANDSCAPE } as const;
const ANDROID_LAND_MDPI_SCREEN = { src: 'android/splash/drawable-land-mdpi-screen.png', format: Format.PNG, width: 480, height: 320, density: Density.LAND_MDPI, orientation: Orientation.LANDSCAPE } as const;
const ANDROID_LAND_HDPI_SCREEN = { src: 'android/splash/drawable-land-hdpi-screen.png', format: Format.PNG, width: 800, height: 480, density: Density.LAND_HDPI, orientation: Orientation.LANDSCAPE } as const;
const ANDROID_LAND_XHDPI_SCREEN = { src: 'android/splash/drawable-land-xhdpi-screen.png', format: Format.PNG, width: 1280, height: 720, density: Density.LAND_XHDPI, orientation: Orientation.LANDSCAPE } as const;
const ANDROID_LAND_XXHDPI_SCREEN = { src: 'android/splash/drawable-land-xxhdpi-screen.png', format: Format.PNG, width: 1600, height: 960, density: Density.LAND_XXHDPI, orientation: Orientation.LANDSCAPE } as const;
const ANDROID_LAND_XXXHDPI_SCREEN = { src: 'android/splash/drawable-land-xxxhdpi-screen.png', format: Format.PNG, width: 1920, height: 1280, density: Density.LAND_XXXHDPI, orientation: Orientation.LANDSCAPE } as const;
const ANDROID_PORT_LDPI_SCREEN = { src: 'android/splash/drawable-port-ldpi-screen.png', format: Format.PNG, width: 240, height: 320, density: Density.PORT_LDPI, orientation: Orientation.PORTRAIT } as const;
const ANDROID_PORT_MDPI_SCREEN = { src: 'android/splash/drawable-port-mdpi-screen.png', format: Format.PNG, width: 320, height: 480, density: Density.PORT_MDPI, orientation: Orientation.PORTRAIT } as const;
const ANDROID_PORT_HDPI_SCREEN = { src: 'android/splash/drawable-port-hdpi-screen.png', format: Format.PNG, width: 480, height: 800, density: Density.PORT_HDPI, orientation: Orientation.PORTRAIT } as const;
const ANDROID_PORT_XHDPI_SCREEN = { src: 'android/splash/drawable-port-xhdpi-screen.png', format: Format.PNG, width: 720, height: 1280, density: Density.PORT_XHDPI, orientation: Orientation.PORTRAIT } as const;
const ANDROID_PORT_XXHDPI_SCREEN = { src: 'android/splash/drawable-port-xxhdpi-screen.png', format: Format.PNG, width: 960, height: 1600, density: Density.PORT_XXHDPI, orientation: Orientation.PORTRAIT } as const;
const ANDROID_PORT_XXXHDPI_SCREEN = { src: 'android/splash/drawable-port-xxxhdpi-screen.png', format: Format.PNG, width: 1280, height: 1920, density: Density.PORT_XXXHDPI, orientation: Orientation.PORTRAIT } as const;

const ANDROID_SPLASH_RESOURCES = [
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
] as const;

const ANDROID_SPLASH_RESOURCES_CONFIG: ResourcesTypeConfig<AndroidSplashConfig> = {
  resources: ANDROID_SPLASH_RESOURCES,
  configXml: {
    nodeName: 'splash',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.DENSITY],
    xpaths: resource => [`splash[@density='${resource.density}']`],
    included: () => true,
  },
};

/**
 * 20pt Icon
 *
 * - iPhone Notification (iOS 7+)
 * - iPad Notification (iOS 7+)
 */
const IOS_ICON_20_PT = { src: 'ios/icon/icon-20.png', format: Format.PNG, width: 20, height: 20 } as const;
const IOS_ICON_20_PT_2X = { src: 'ios/icon/icon-20@2x.png', format: Format.PNG, width: 40, height: 40 } as const;
const IOS_ICON_20_PT_3X = { src: 'ios/icon/icon-20@3x.png', format: Format.PNG, width: 60, height: 60 } as const;

/**
 * 29pt Icon
 *
 * - iPhone Settings (iOS 7+)
 * - iPad Settings (iOS 7+)
 * - Apple Watch Companion Settings
 * - Apple Watch Notification Center
 */
const IOS_ICON_29_PT = { src: 'ios/icon/icon-29.png', format: Format.PNG, width: 29, height: 29 } as const;
const IOS_ICON_29_PT_2X = { src: 'ios/icon/icon-29@2x.png', format: Format.PNG, width: 58, height: 58 } as const;
const IOS_ICON_29_PT_3X = { src: 'ios/icon/icon-29@3x.png', format: Format.PNG, width: 87, height: 87 } as const;

/**
 * 40pt Icon
 *
 * - iPhone Spotlight (iOS 7+)
 * - iPad Spotlight (iOS 7+)
 * - Apple Watch Home Screen
 */
const IOS_ICON_40_PT = { src: 'ios/icon/icon-40.png', format: Format.PNG, width: 40, height: 40 } as const;
const IOS_ICON_40_PT_2X = { src: 'ios/icon/icon-40@2x.png', format: Format.PNG, width: 80, height: 80 } as const;
const IOS_ICON_40_PT_3X = { src: 'ios/icon/icon-40@3x.png', format: Format.PNG, width: 120, height: 120 } as const;

/**
 * 50pt Icon
 *
 * - iPad Spotlight (iOS 5,6)
 * - Apple Watch Home Screen
 */
const IOS_ICON_50_PT = { src: 'ios/icon/icon-50.png', format: Format.PNG, width: 50, height: 50 } as const;
const IOS_ICON_50_PT_2X = { src: 'ios/icon/icon-50@2x.png', format: Format.PNG, width: 100, height: 100 } as const;

/**
 * 57pt Icon
 *
 * - iPhone App (iOS 5,6)
 */
const IOS_ICON_57_PT = { src: 'ios/icon/icon.png', format: Format.PNG, width: 57, height: 57 } as const;
const IOS_ICON_57_PT_2X = { src: 'ios/icon/icon@2x.png', format: Format.PNG, width: 114, height: 114 } as const;

/**
 * 60pt Icon
 *
 * - iPhone App (iOS 7+)
 */
const IOS_ICON_60_PT = { src: 'ios/icon/icon-60.png', format: Format.PNG, width: 60, height: 60 } as const;
const IOS_ICON_60_PT_2X = { src: 'ios/icon/icon-60@2x.png', format: Format.PNG, width: 120, height: 120 } as const;
const IOS_ICON_60_PT_3X = { src: 'ios/icon/icon-60@3x.png', format: Format.PNG, width: 180, height: 180 } as const;

/**
 * 72pt Icon
 *
 * - iPad App (iOS 5,6)
 */
const IOS_ICON_72_PT = { src: 'ios/icon/icon-72.png', format: Format.PNG, width: 72, height: 72 } as const;
const IOS_ICON_72_PT_2X = { src: 'ios/icon/icon-72@2x.png', format: Format.PNG, width: 144, height: 144 } as const;

/**
 * 76pt Icon
 *
 * - iPad App (iOS 7+)
 */
const IOS_ICON_76_PT = { src: 'ios/icon/icon-76.png', format: Format.PNG, width: 76, height: 76 } as const;
const IOS_ICON_76_PT_2X = { src: 'ios/icon/icon-76@2x.png', format: Format.PNG, width: 152, height: 152 } as const;

/**
 * 83.5pt Icon
 *
 * iPad Pro (12.9-inch)
 */
const IOS_ICON_83_5_PT_2X = { src: 'ios/icon/icon-83.5@2x.png', format: Format.PNG, width: 167, height: 167 } as const;

/**
 * 1024px Icon
 *
 * - App Store
 */
const IOS_ICON_1024 = { src: 'ios/icon/icon-1024.png', format: Format.PNG, width: 1024, height: 1024 } as const;

/**
 * 24pt Icon
 *
 * - Apple Watch Notification Center
 */
const IOS_ICON_24_PT = { src: 'ios/icon/icon-24@2x.png', format: Format.PNG, width: 48, height: 48 } as const;

/**
 * 27.5pt Icon
 *
 * - Apple Watch Notification Center
 */
const IOS_ICON_27_5_PT = { src: 'ios/icon/icon-27.5@2x.png', format: Format.PNG, width: 55, height: 55 } as const;

/**
 * 44pt Icon
 *
 * - Apple Watch Home Screen
 */
const IOS_ICON_44_PT_2X = { src: 'ios/icon/icon-44@2x.png', format: Format.PNG, width: 88, height: 88 } as const;

/**
 * 86pt Icon
 *
 * - Apple Watch Short Look
 */
const IOS_ICON_86_PT_2X = { src: 'ios/icon/icon-86@2x.png', format: Format.PNG, width: 172, height: 172 } as const;

/**
 * 98pt Icon
 *
 * - Apple Watch Short Look
 */
const IOS_ICON_98_PT_2X = { src: 'ios/icon/icon-98@2x.png', format: Format.PNG, width: 196, height: 196 } as const;

/**
 * 108pt Icon
 *
 * - Apple Watch Short Look
 */
const IOS_ICON_108_PT_2X = { src: 'ios/icon/icon-108@2x.png', format: Format.PNG, width: 216, height: 216 } as const;

const IOS_ICON_RESOURCES = [
  IOS_ICON_57_PT,
  IOS_ICON_57_PT_2X,
  IOS_ICON_20_PT,
  IOS_ICON_20_PT_2X,
  IOS_ICON_20_PT_3X,
  IOS_ICON_29_PT,
  IOS_ICON_29_PT_2X,
  IOS_ICON_29_PT_3X,
  IOS_ICON_24_PT,
  IOS_ICON_27_5_PT,
  IOS_ICON_44_PT_2X,
  IOS_ICON_86_PT_2X,
  IOS_ICON_98_PT_2X,
  IOS_ICON_108_PT_2X,
  IOS_ICON_40_PT,
  IOS_ICON_40_PT_2X,
  IOS_ICON_40_PT_3X,
  IOS_ICON_50_PT,
  IOS_ICON_50_PT_2X,
  IOS_ICON_60_PT,
  IOS_ICON_60_PT_2X,
  IOS_ICON_60_PT_3X,
  IOS_ICON_72_PT,
  IOS_ICON_72_PT_2X,
  IOS_ICON_76_PT,
  IOS_ICON_76_PT_2X,
  IOS_ICON_83_5_PT_2X,
  IOS_ICON_1024,
] as const;

const IOS_ICON_RESOURCES_CONFIG: ResourcesTypeConfig<IOSIconConfig> = {
  resources: IOS_ICON_RESOURCES,
  configXml: {
    nodeName: 'icon',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.WIDTH, NodeAttributes.HEIGHT],
    xpaths: xpathsForPathAttribute('icon', NodeAttributes.SRC.key),
    included: () => true,
  },
};

const IOS_SPLASH_568H_2X_IPHONE = { src: 'ios/splash/Default-568h@2x~iphone.png', format: Format.PNG, width: 640, height: 1136, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_667H = { src: 'ios/splash/Default-667h.png', format: Format.PNG, width: 750, height: 1334, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_2688H_IPHONE = { src: 'ios/splash/Default-2688h~iphone.png', format: Format.PNG, width: 1242, height: 2688, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_2688H_LANDSCAPE_IPHONE = { src: 'ios/splash/Default-Landscape-2688h~iphone.png', format: Format.PNG, width: 2688, height: 1242, orientation: Orientation.LANDSCAPE } as const;
const IOS_SPLASH_1792H_IPHONE = { src: 'ios/splash/Default-1792h~iphone.png', format: Format.PNG, width: 828, height: 1792, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_1792H_LANDSCAPE_IPHONE = { src: 'ios/splash/Default-Landscape-1792h~iphone.png', format: Format.PNG, width: 1792, height: 828, orientation: Orientation.LANDSCAPE } as const;
const IOS_SPLASH_2436H = { src: 'ios/splash/Default-2436h.png', format: Format.PNG, width: 1125, height: 2436, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_2436H_LANDSCAPE = { src: 'ios/splash/Default-Landscape-2436h.png', format: Format.PNG, width: 2436, height: 1125, orientation: Orientation.LANDSCAPE } as const;
const IOS_SPLASH_736H = { src: 'ios/splash/Default-736h.png', format: Format.PNG, width: 1242, height: 2208, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_736H_LANDSCAPE = { src: 'ios/splash/Default-Landscape-736h.png', format: Format.PNG, width: 2208, height: 1242, orientation: Orientation.LANDSCAPE } as const;
const IOS_SPLASH_LANDSCAPE_2X_IPAD = { src: 'ios/splash/Default-Landscape@2x~ipad.png', format: Format.PNG, width: 2048, height: 1536, orientation: Orientation.LANDSCAPE } as const;
const IOS_SPLASH_LANDSCAPE_IPADPRO = { src: 'ios/splash/Default-Landscape@~ipadpro.png', format: Format.PNG, width: 2732, height: 2048, orientation: Orientation.LANDSCAPE } as const;
const IOS_SPLASH_LANDSCAPE_IPAD = { src: 'ios/splash/Default-Landscape~ipad.png', format: Format.PNG, width: 1024, height: 768, orientation: Orientation.LANDSCAPE } as const;
const IOS_SPLASH_PORTRAIT_2X_IPAD = { src: 'ios/splash/Default-Portrait@2x~ipad.png', format: Format.PNG, width: 1536, height: 2048, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_PORTRAIT_IPADPRO = { src: 'ios/splash/Default-Portrait@~ipadpro.png', format: Format.PNG, width: 2048, height: 2732, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_PORTRAIT_IPAD = { src: 'ios/splash/Default-Portrait~ipad.png', format: Format.PNG, width: 768, height: 1024, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_2X_IPHONE = { src: 'ios/splash/Default@2x~iphone.png', format: Format.PNG, width: 640, height: 960, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_IPHONE = { src: 'ios/splash/Default~iphone.png', format: Format.PNG, width: 320, height: 480, orientation: Orientation.PORTRAIT } as const;
const IOS_SPLASH_2X_UNIVERSAL_ANYANY = { src: 'ios/splash/Default@2x~universal~anyany.png', format: Format.PNG, width: 2732, height: 2732, orientation: Orientation.PORTRAIT } as const;

const IOS_SPLASH_RESOURCES = [
  IOS_SPLASH_568H_2X_IPHONE,
  IOS_SPLASH_667H,
  IOS_SPLASH_2688H_IPHONE,
  IOS_SPLASH_2688H_LANDSCAPE_IPHONE,
  IOS_SPLASH_1792H_IPHONE,
  IOS_SPLASH_1792H_LANDSCAPE_IPHONE,
  IOS_SPLASH_2436H,
  IOS_SPLASH_2436H_LANDSCAPE,
  IOS_SPLASH_736H,
  IOS_SPLASH_736H_LANDSCAPE,
  IOS_SPLASH_LANDSCAPE_2X_IPAD,
  IOS_SPLASH_LANDSCAPE_IPADPRO,
  IOS_SPLASH_LANDSCAPE_IPAD,
  IOS_SPLASH_PORTRAIT_2X_IPAD,
  IOS_SPLASH_PORTRAIT_IPADPRO,
  IOS_SPLASH_PORTRAIT_IPAD,
  IOS_SPLASH_2X_IPHONE,
  IOS_SPLASH_IPHONE,
  IOS_SPLASH_2X_UNIVERSAL_ANYANY,
] as const;

const IOS_SPLASH_RESOURCES_CONFIG: ResourcesTypeConfig<IOSSplashConfig> = {
  resources: IOS_SPLASH_RESOURCES,
  configXml: {
    nodeName: 'splash',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.WIDTH, NodeAttributes.HEIGHT],
    xpaths: xpathsForPathAttribute('splash', NodeAttributes.SRC.key),
    included: () => true,
  },
};
