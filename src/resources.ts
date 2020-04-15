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

export type ResourcesImageConfig = (
  Required<Pick<ResourceKeyValues, ResourceKey.SRC | ResourceKey.FORMAT | ResourceKey.WIDTH | ResourceKey.HEIGHT>> &
  Pick<ResourceKeyValues, ResourceKey.DENSITY | ResourceKey.ORIENTATION | ResourceKey.TARGET>
);

export type AndroidAdaptiveIconConfig = (
  Required<Pick<ResourceKeyValues, ResourceKey.FOREGROUND | ResourceKey.BACKGROUND | ResourceKey.FORMAT | ResourceKey.WIDTH | ResourceKey.HEIGHT>> &
  Pick<ResourceKeyValues, ResourceKey.DENSITY>
);

export const enum ResourceNodeAttributeType {
  PATH = 'path',
}

export interface ResourceNodeAttribute<K = ResourceKey> {
  readonly key: K;
  readonly type?: ResourceNodeAttributeType;
}

export interface ResourcesTypeConfig<C extends ResourceKeyValues, I extends ResourceKey> {
  readonly resources: readonly C[];

  /**
   * Metadata for Cordova's config.xml
   */
  readonly configXml: {

    /**
     * XML node name of this resource (e.g. 'icon', 'splash')
     */
    readonly nodeName: string;

    /**
     * An array of resource keys to copy into the XML node as attributes
     */
    readonly nodeAttributes: readonly ResourceNodeAttribute[];

    /**
     * Uniquely identifies a node.
     *
     * Use `nodeName` and this attribute to look up existing nodes in the XML.
     * This is important because nodes need to be replaced if found.
     */
    readonly indexAttribute: ResourceNodeAttribute<I>;

    /**
     * Resources to include in the XML keyed by indexAttribute values
     */
    readonly includedResources: readonly Required<ResourceKeyValues>[I][];
  };
}

export type ResourcesPlatform = { readonly [T in ResourceType.ICON | ResourceType.SPLASH]: ResourcesTypeConfig<ResourcesImageConfig, ResourceKey>; };
export type ResourcesConfig = { readonly [P in Platform]: ResourcesPlatform; };

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

export function getResourcesConfig(platform: Platform.ANDROID, type: ResourceType.ADAPTIVE_ICON): ResourcesTypeConfig<AndroidAdaptiveIconConfig, ResourceKey.DENSITY>;
export function getResourcesConfig(platform: Platform, type: ResourceType): ResourcesTypeConfig<ResourcesImageConfig, ResourceKey>;
export function getResourcesConfig(platform: Platform, type: ResourceType): ResourcesTypeConfig<ResourcesImageConfig, ResourceKey> | ResourcesTypeConfig<AndroidAdaptiveIconConfig, ResourceKey.DENSITY> {
  if (type === ResourceType.ADAPTIVE_ICON) {
    return ANDROID_ADAPTIVE_ICON_RESOURCES;
  }

  return RESOURCES[platform][type];
}

const WINDOWS_ICON_RESOURCES: ResourcesTypeConfig<ResourcesImageConfig, ResourceKey.SRC> = {
  resources: [
    // @see https://cordova.apache.org/docs/en/latest/config_ref/images.html#windows
    // @see https://docs.microsoft.com/en-us/windows/uwp/design/style/app-icons-and-logos
    // @see https://docs.microsoft.com/en-us/windows/uwp/design/style/app-icons-and-logos#icon-types-locations-and-scale-factors

    // App Icon: App list in start menu, task bar, task manager
    { src: 'windows/icon/Square44x44Logo.png', format: Format.NONE, width: 44, height: 44, target: Target.SQUARE_44_X_44_LOGO },
    { src: 'windows/icon/Square44x44Logo.scale-100.png', format: Format.PNG, width: 44, height: 44 },
    { src: 'windows/icon/Square44x44Logo.scale-125.png', format: Format.PNG, width: 55, height: 55 },
    { src: 'windows/icon/Square44x44Logo.scale-140.png', format: Format.PNG, width: 62, height: 62 },
    { src: 'windows/icon/Square44x44Logo.scale-150.png', format: Format.PNG, width: 66, height: 66 },
    { src: 'windows/icon/Square44x44Logo.scale-200.png', format: Format.PNG, width: 88, height: 88 },
    { src: 'windows/icon/Square44x44Logo.scale-240.png', format: Format.PNG, width: 106, height: 106 },
    { src: 'windows/icon/Square44x44Logo.scale-400.png', format: Format.PNG, width: 176, height: 176 },

    // Small tile: Start menu
    { src: 'windows/icon/SmallTile.png', format: Format.NONE, width: 71, height: 71, target: Target.SQUARE_71_X_71_LOGO },
    { src: 'windows/icon/SmallTile.scale-100.png', format: Format.PNG, width: 71, height: 71 },
    { src: 'windows/icon/SmallTile.scale-125.png', format: Format.PNG, width: 89, height: 89 },
    { src: 'windows/icon/SmallTile.scale-140.png', format: Format.PNG, width: 99, height: 99 },
    { src: 'windows/icon/SmallTile.scale-150.png', format: Format.PNG, width: 107, height: 107 },
    { src: 'windows/icon/SmallTile.scale-200.png', format: Format.PNG, width: 142, height: 142 },
    { src: 'windows/icon/SmallTile.scale-240.png', format: Format.PNG, width: 170, height: 170 },
    { src: 'windows/icon/SmallTile.scale-400.png', format: Format.PNG, width: 284, height: 284 },

    // Medium Tile: For Start menu, Microsoft Store listing
    { src: 'windows/icon/Square150x150Logo.png', format: Format.NONE, width: 150, height: 150, target: Target.SQUARE_150_X_150_LOGO },
    { src: 'windows/icon/Square150x150Logo.scale-100.png', format: Format.PNG, width: 150, height: 150 },
    { src: 'windows/icon/Square150x150Logo.scale-125.png', format: Format.PNG, width: 188, height: 188 },
    { src: 'windows/icon/Square150x150Logo.scale-140.png', format: Format.PNG, width: 210, height: 210 },
    { src: 'windows/icon/Square150x150Logo.scale-150.png', format: Format.PNG, width: 225, height: 225 },
    { src: 'windows/icon/Square150x150Logo.scale-200.png', format: Format.PNG, width: 300, height: 300 },
    { src: 'windows/icon/Square150x150Logo.scale-240.png', format: Format.PNG, width: 360, height: 360 },
    { src: 'windows/icon/Square150x150Logo.scale-400.png', format: Format.PNG, width: 600, height: 600 },

    // Large Tile: Start Menu
    { src: 'windows/icon/Square310x310Logo.png', format: Format.NONE, width: 310, height: 310, target: Target.SQUARE_310_X_310_LOGO },
    { src: 'windows/icon/Square310x310Logo.scale-100.png', format: Format.PNG, width: 310, height: 310 },
    { src: 'windows/icon/Square310x310Logo.scale-125.png', format: Format.PNG, width: 388, height: 388 },
    { src: 'windows/icon/Square310x310Logo.scale-140.png', format: Format.PNG, width: 434, height: 434 },
    { src: 'windows/icon/Square310x310Logo.scale-150.png', format: Format.PNG, width: 465, height: 465 },
    { src: 'windows/icon/Square310x310Logo.scale-180.png', format: Format.PNG, width: 558, height: 558 },
    { src: 'windows/icon/Square310x310Logo.scale-200.png', format: Format.PNG, width: 620, height: 620 },
    { src: 'windows/icon/Square310x310Logo.scale-400.png', format: Format.PNG, width: 1240, height: 1240 },

    // Wide Tile: Start Menu
    { src: 'windows/icon/Wide310x150Logo.png', format: Format.NONE, width: 310, height : 150, target: Target.WIDE_310_X_150_LOGO },
    { src: 'windows/icon/Wide310x150Logo.scale-80.png', format: Format.PNG, width: 248, height : 120 },
    { src: 'windows/icon/Wide310x150Logo.scale-100.png', format: Format.PNG, width: 310, height : 150 },
    { src: 'windows/icon/Wide310x150Logo.scale-125.png', format: Format.PNG, width: 388, height : 188 },
    { src: 'windows/icon/Wide310x150Logo.scale-140.png', format: Format.PNG, width: 434, height : 210 },
    { src: 'windows/icon/Wide310x150Logo.scale-150.png', format: Format.PNG, width: 465, height : 225 },
    { src: 'windows/icon/Wide310x150Logo.scale-180.png', format: Format.PNG, width: 558, height : 270 },
    { src: 'windows/icon/Wide310x150Logo.scale-200.png', format: Format.PNG, width: 620, height : 300 },
    { src: 'windows/icon/Wide310x150Logo.scale-240.png', format: Format.PNG, width: 744, height : 360 },
    { src: 'windows/icon/Wide310x150Logo.scale-400.png', format: Format.PNG, width: 1240, height : 600 },

    // Store Logo: App installer, Partner Center, the "Report an app" option in the Store, the "Write a review" option in the Store
    { src: 'windows/icon/StoreLogo.png', format: Format.NONE, width: 50, height: 50, target: Target.STORE_LOGO },
    { src: 'windows/icon/StoreLogo.scale-100.png', format: Format.PNG, width: 50, height: 50 },
    { src: 'windows/icon/StoreLogo.scale-125.png', format: Format.PNG, width: 63, height: 63 },
    { src: 'windows/icon/StoreLogo.scale-140.png', format: Format.PNG, width: 70, height: 70 },
    { src: 'windows/icon/StoreLogo.scale-150.png', format: Format.PNG, width: 75, height: 75 },
    { src: 'windows/icon/StoreLogo.scale-180.png', format: Format.PNG, width: 90, height: 90 },
    { src: 'windows/icon/StoreLogo.scale-200.png', format: Format.PNG, width: 100, height: 100 },
    { src: 'windows/icon/StoreLogo.scale-240.png', format: Format.PNG, width: 120, height: 120 },
    { src: 'windows/icon/StoreLogo.scale-400.png', format: Format.PNG, width: 200, height: 200 },
  ],
  configXml: {
    nodeName: 'icon',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.TARGET],
    indexAttribute: NodeAttributes.SRC,
    includedResources: [
      'windows/icon/Square44x44Logo.png',
      'windows/icon/SmallTile.png',
      'windows/icon/Square150x150Logo.png',
      'windows/icon/Square310x310Logo.png',
      'windows/icon/Wide310x150Logo.png',
      'windows/icon/StoreLogo.png',
    ],
  },
};

const WINDOWS_SPLASH_RESOURCES: ResourcesTypeConfig<ResourcesImageConfig, ResourceKey.SRC> = {
  resources: [
    // @see https://msdn.microsoft.com/en-us/windows/desktop/hh465338
    // @see https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-splashscreen/index.html#windows-specific-information
    { src: 'windows/splash/Splash.png', format: Format.NONE, width: 620, height: 300, orientation: Orientation.LANDSCAPE, target: Target.SPLASH_SCREEN },
    { src: 'windows/splash/Splash.scale-100.png', format: Format.PNG, width: 620, height: 300, orientation: Orientation.LANDSCAPE },
    { src: 'windows/splash/Splash.scale-125.png', format: Format.PNG, width: 775, height: 375, orientation: Orientation.LANDSCAPE },
    { src: 'windows/splash/Splash.scale-150.png', format: Format.PNG, width: 930, height: 450, orientation: Orientation.LANDSCAPE },
    { src: 'windows/splash/Splash.scale-200.png', format: Format.PNG, width: 1240, height: 600, orientation: Orientation.LANDSCAPE },
    { src: 'windows/splash/Splash.scale-400.png', format: Format.PNG, width: 2480, height: 1200, orientation: Orientation.LANDSCAPE },
  ],
  configXml: {
    nodeName: 'splash',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.TARGET],
    indexAttribute: NodeAttributes.SRC,
    includedResources: [
      'windows/splash/Splash.png',
    ],
  },
};

const ANDROID_ADAPTIVE_ICON_RESOURCES: ResourcesTypeConfig<AndroidAdaptiveIconConfig, ResourceKey.DENSITY> = {
  resources: [
    { foreground: 'android/icon/ldpi-foreground.png', background: 'android/icon/ldpi-background.png', format: Format.PNG, width: 81, height: 81, density: Density.LDPI },
    { foreground: 'android/icon/mdpi-foreground.png', background: 'android/icon/mdpi-background.png', format: Format.PNG, width: 108, height: 108, density: Density.MDPI },
    { foreground: 'android/icon/hdpi-foreground.png', background: 'android/icon/hdpi-background.png', format: Format.PNG, width: 162, height: 162, density: Density.HDPI },
    { foreground: 'android/icon/xhdpi-foreground.png', background: 'android/icon/xhdpi-background.png', format: Format.PNG, width: 216, height: 216, density: Density.XHDPI },
    { foreground: 'android/icon/xxhdpi-foreground.png', background: 'android/icon/xxhdpi-background.png', format: Format.PNG, width: 324, height: 324, density: Density.XXHDPI },
    { foreground: 'android/icon/xxxhdpi-foreground.png', background: 'android/icon/xxxhdpi-background.png', format: Format.PNG, width: 432, height: 432, density: Density.XXXHDPI },
  ],
  configXml: {
    nodeName: 'icon',
    nodeAttributes: [NodeAttributes.FOREGROUND, NodeAttributes.DENSITY, NodeAttributes.BACKGROUND],
    indexAttribute: NodeAttributes.DENSITY,
    includedResources: [
      Density.LDPI,
      Density.MDPI,
      Density.HDPI,
      Density.XHDPI,
      Density.XXHDPI,
      Density.XXXHDPI,
    ],
  },
};

const ANDROID_ICON_RESOURCES: ResourcesTypeConfig<ResourcesImageConfig, ResourceKey.DENSITY> = {
  resources: [
    { src: 'android/icon/drawable-ldpi-icon.png', format: Format.PNG, width: 36, height: 36, density: Density.LDPI },
    { src: 'android/icon/drawable-mdpi-icon.png', format: Format.PNG, width: 48, height: 48, density: Density.MDPI },
    { src: 'android/icon/drawable-hdpi-icon.png', format: Format.PNG, width: 72, height: 72, density: Density.HDPI },
    { src: 'android/icon/drawable-xhdpi-icon.png', format: Format.PNG, width: 96, height: 96, density: Density.XHDPI },
    { src: 'android/icon/drawable-xxhdpi-icon.png', format: Format.PNG, width: 144, height: 144, density: Density.XXHDPI },
    { src: 'android/icon/drawable-xxxhdpi-icon.png', format: Format.PNG, width: 192, height: 192, density: Density.XXXHDPI },
  ],
  configXml: {
    nodeName: 'icon',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.DENSITY],
    indexAttribute: NodeAttributes.DENSITY,
    includedResources: [
      Density.LDPI,
      Density.MDPI,
      Density.HDPI,
      Density.XHDPI,
      Density.XXHDPI,
      Density.XXXHDPI,
    ],
  },
};

const ANDROID_SPLASH_RESOURCES: ResourcesTypeConfig<ResourcesImageConfig, ResourceKey.DENSITY> = {
  resources: [
    { src: 'android/splash/drawable-land-ldpi-screen.png', format: Format.PNG, width: 320, height: 240, density: Density.LAND_LDPI, orientation: Orientation.LANDSCAPE },
    { src: 'android/splash/drawable-land-mdpi-screen.png', format: Format.PNG, width: 480, height: 320, density: Density.LAND_MDPI, orientation: Orientation.LANDSCAPE },
    { src: 'android/splash/drawable-land-hdpi-screen.png', format: Format.PNG, width: 800, height: 480, density: Density.LAND_HDPI, orientation: Orientation.LANDSCAPE },
    { src: 'android/splash/drawable-land-xhdpi-screen.png', format: Format.PNG, width: 1280, height: 720, density: Density.LAND_XHDPI, orientation: Orientation.LANDSCAPE },
    { src: 'android/splash/drawable-land-xxhdpi-screen.png', format: Format.PNG, width: 1600, height: 960, density: Density.LAND_XXHDPI, orientation: Orientation.LANDSCAPE },
    { src: 'android/splash/drawable-land-xxxhdpi-screen.png', format: Format.PNG, width: 1920, height: 1280, density: Density.LAND_XXXHDPI, orientation: Orientation.LANDSCAPE },
    { src: 'android/splash/drawable-port-ldpi-screen.png', format: Format.PNG, width: 240, height: 320, density: Density.PORT_LDPI, orientation: Orientation.PORTRAIT },
    { src: 'android/splash/drawable-port-mdpi-screen.png', format: Format.PNG, width: 320, height: 480, density: Density.PORT_MDPI, orientation: Orientation.PORTRAIT },
    { src: 'android/splash/drawable-port-hdpi-screen.png', format: Format.PNG, width: 480, height: 800, density: Density.PORT_HDPI, orientation: Orientation.PORTRAIT },
    { src: 'android/splash/drawable-port-xhdpi-screen.png', format: Format.PNG, width: 720, height: 1280, density: Density.PORT_XHDPI, orientation: Orientation.PORTRAIT },
    { src: 'android/splash/drawable-port-xxhdpi-screen.png', format: Format.PNG, width: 960, height: 1600, density: Density.PORT_XXHDPI, orientation: Orientation.PORTRAIT },
    { src: 'android/splash/drawable-port-xxxhdpi-screen.png', format: Format.PNG, width: 1280, height: 1920, density: Density.PORT_XXXHDPI, orientation: Orientation.PORTRAIT },
  ],
  configXml: {
    nodeName: 'splash',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.DENSITY],
    indexAttribute: NodeAttributes.DENSITY,
    includedResources: [
      Density.LAND_LDPI,
      Density.LAND_MDPI,
      Density.LAND_HDPI,
      Density.LAND_XHDPI,
      Density.LAND_XXHDPI,
      Density.LAND_XXHDPI,
      Density.LAND_XXXHDPI,
      Density.PORT_LDPI,
      Density.PORT_MDPI,
      Density.PORT_HDPI,
      Density.PORT_XHDPI,
      Density.PORT_XXHDPI,
      Density.PORT_XXHDPI,
      Density.PORT_XXXHDPI,
    ],
  },
};

const IOS_ICON_RESOURCES: ResourcesTypeConfig<ResourcesImageConfig, ResourceKey.SRC> = {
  resources: [
    { src: 'ios/icon/icon.png', format: Format.PNG, width: 57, height: 57 },
    { src: 'ios/icon/icon@2x.png', format: Format.PNG, width: 114, height: 114 },
    { src: 'ios/icon/icon-20.png', format: Format.PNG, width: 20, height: 20 },
    { src: 'ios/icon/icon-20@2x.png', format: Format.PNG, width: 40, height: 40 },
    { src: 'ios/icon/icon-20@3x.png', format: Format.PNG, width: 60, height: 60 },
    { src: 'ios/icon/icon-29.png', format: Format.PNG, width: 29, height: 29 },
    { src: 'ios/icon/icon-29@2x.png', format: Format.PNG, width: 58, height: 58 },
    { src: 'ios/icon/icon-29@3x.png', format: Format.PNG, width: 87, height: 87 },
    { src: 'ios/icon/icon-24@2x.png', format: Format.PNG, width: 48, height: 48 },
    { src: 'ios/icon/icon-27.5@2x.png', format: Format.PNG, width: 55, height: 55 },
    { src: 'ios/icon/icon-44@2x.png', format: Format.PNG, width: 88, height: 88 },
    { src: 'ios/icon/icon-86@2x.png', format: Format.PNG, width: 172, height: 172 },
    { src: 'ios/icon/icon-98@2x.png', format: Format.PNG, width: 196, height: 196 },
    { src: 'ios/icon/icon-108@2x.png', format: Format.PNG, width: 216, height: 216 },
    { src: 'ios/icon/icon-40.png', format: Format.PNG, width: 40, height: 40 },
    { src: 'ios/icon/icon-40@2x.png', format: Format.PNG, width: 80, height: 80 },
    { src: 'ios/icon/icon-40@3x.png', format: Format.PNG, width: 120, height: 120 },
    { src: 'ios/icon/icon-50.png', format: Format.PNG, width: 50, height: 50 },
    { src: 'ios/icon/icon-50@2x.png', format: Format.PNG, width: 100, height: 100 },
    { src: 'ios/icon/icon-60.png', format: Format.PNG, width: 60, height: 60 },
    { src: 'ios/icon/icon-60@2x.png', format: Format.PNG, width: 120, height: 120 },
    { src: 'ios/icon/icon-60@3x.png', format: Format.PNG, width: 180, height: 180 },
    { src: 'ios/icon/icon-72.png', format: Format.PNG, width: 72, height: 72 },
    { src: 'ios/icon/icon-72@2x.png', format: Format.PNG, width: 144, height: 144 },
    { src: 'ios/icon/icon-76.png', format: Format.PNG, width: 76, height: 76 },
    { src: 'ios/icon/icon-76@2x.png', format: Format.PNG, width: 152, height: 152 },
    { src: 'ios/icon/icon-83.5@2x.png', format: Format.PNG, width: 167, height: 167 },
    { src: 'ios/icon/icon-small.png', format: Format.PNG, width: 29, height: 29 },
    { src: 'ios/icon/icon-small@2x.png', format: Format.PNG, width: 58, height: 58 },
    { src: 'ios/icon/icon-small@3x.png', format: Format.PNG, width: 87, height: 87 },
    { src: 'ios/icon/icon-1024.png', format: Format.PNG, width: 1024, height: 1024 },
  ],
  configXml: {
    nodeName: 'icon',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.WIDTH, NodeAttributes.HEIGHT],
    indexAttribute: NodeAttributes.SRC,
    includedResources: [
      'ios/icon/icon.png',
      'ios/icon/icon@2x.png',
      'ios/icon/icon-20.png',
      'ios/icon/icon-20@2x.png',
      'ios/icon/icon-20@3x.png',
      'ios/icon/icon-29.png',
      'ios/icon/icon-29@2x.png',
      'ios/icon/icon-29@3x.png',
      'ios/icon/icon-24@2x.png',
      'ios/icon/icon-27.5@2x.png',
      'ios/icon/icon-44@2x.png',
      'ios/icon/icon-86@2x.png',
      'ios/icon/icon-98@2x.png',
      'ios/icon/icon-108@2x.png',
      'ios/icon/icon-40.png',
      'ios/icon/icon-40@2x.png',
      'ios/icon/icon-40@3x.png',
      'ios/icon/icon-50.png',
      'ios/icon/icon-50@2x.png',
      'ios/icon/icon-60.png',
      'ios/icon/icon-60@2x.png',
      'ios/icon/icon-60@3x.png',
      'ios/icon/icon-72.png',
      'ios/icon/icon-72@2x.png',
      'ios/icon/icon-76.png',
      'ios/icon/icon-76@2x.png',
      'ios/icon/icon-83.5@2x.png',
      'ios/icon/icon-small.png',
      'ios/icon/icon-small@2x.png',
      'ios/icon/icon-small@3x.png',
      'ios/icon/icon-1024.png',
    ],
  },
};

const IOS_SPLASH_RESOURCES = {
  resources: [
    { src: 'ios/splash/Default-568h@2x~iphone.png', format: Format.PNG, width: 640, height: 1136, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default-667h.png', format: Format.PNG, width: 750, height: 1334, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default-2688h~iphone.png', format: Format.PNG, width: 1242, height: 2688, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default-Landscape-2688h~iphone.png', format: Format.PNG, width: 2688, height: 1242, orientation: Orientation.LANDSCAPE },
    { src: 'ios/splash/Default-1792h~iphone.png', format: Format.PNG, width: 828, height: 1792, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default-Landscape-1792h~iphone.png', format: Format.PNG, width: 1792, height: 828, orientation: Orientation.LANDSCAPE },
    { src: 'ios/splash/Default-2436h.png', format: Format.PNG, width: 1125, height: 2436, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default-Landscape-2436h.png', format: Format.PNG, width: 2436, height: 1125, orientation: Orientation.LANDSCAPE },
    { src: 'ios/splash/Default-736h.png', format: Format.PNG, width: 1242, height: 2208, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default-Landscape-736h.png', format: Format.PNG, width: 2208, height: 1242, orientation: Orientation.LANDSCAPE },
    { src: 'ios/splash/Default-Landscape@2x~ipad.png', format: Format.PNG, width: 2048, height: 1536, orientation: Orientation.LANDSCAPE },
    { src: 'ios/splash/Default-Landscape@~ipadpro.png', format: Format.PNG, width: 2732, height: 2048, orientation: Orientation.LANDSCAPE },
    { src: 'ios/splash/Default-Landscape~ipad.png', format: Format.PNG, width: 1024, height: 768, orientation: Orientation.LANDSCAPE },
    { src: 'ios/splash/Default-Portrait@2x~ipad.png', format: Format.PNG, width: 1536, height: 2048, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default-Portrait@~ipadpro.png', format: Format.PNG, width: 2048, height: 2732, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default-Portrait~ipad.png', format: Format.PNG, width: 768, height: 1024, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default@2x~iphone.png', format: Format.PNG, width: 640, height: 960, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default~iphone.png', format: Format.PNG, width: 320, height: 480, orientation: Orientation.PORTRAIT },
    { src: 'ios/splash/Default@2x~universal~anyany.png', format: Format.PNG, width: 2732, height: 2732 },
  ],
  configXml: {
    nodeName: 'splash',
    nodeAttributes: [NodeAttributes.SRC, NodeAttributes.WIDTH, NodeAttributes.HEIGHT],
    indexAttribute: NodeAttributes.SRC,
    includedResources: [
      'ios/splash/Default-568h@2x~iphone.png',
      'ios/splash/Default-667h.png',
      'ios/splash/Default-2688h~iphone.png',
      'ios/splash/Default-Landscape-2688h~iphone.png',
      'ios/splash/Default-1792h~iphone.png',
      'ios/splash/Default-Landscape-1792h~iphone.png',
      'ios/splash/Default-2436h.png',
      'ios/splash/Default-Landscape-2436h.png',
      'ios/splash/Default-736h.png',
      'ios/splash/Default-Landscape-736h.png',
      'ios/splash/Default-Landscape@2x~ipad.png',
      'ios/splash/Default-Landscape@~ipadpro.png',
      'ios/splash/Default-Landscape~ipad.png',
      'ios/splash/Default-Portrait@2x~ipad.png',
      'ios/splash/Default-Portrait@~ipadpro.png',
      'ios/splash/Default-Portrait~ipad.png',
      'ios/splash/Default@2x~iphone.png',
      'ios/splash/Default~iphone.png',
      'ios/splash/Default@2x~universal~anyany.png',
    ],
  },
};

const RESOURCES: ResourcesConfig = {
  [Platform.WINDOWS]: {
    [ResourceType.ICON]: WINDOWS_ICON_RESOURCES,
    [ResourceType.SPLASH]: WINDOWS_SPLASH_RESOURCES,
  },
  [Platform.ANDROID]: {
    [ResourceType.ICON]: ANDROID_ICON_RESOURCES,
    [ResourceType.SPLASH]: ANDROID_SPLASH_RESOURCES,
  },
  [Platform.IOS]: {
    [ResourceType.ICON]: IOS_ICON_RESOURCES,
    [ResourceType.SPLASH]: IOS_SPLASH_RESOURCES,
  },
};
