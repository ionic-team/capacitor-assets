import { Metadata, Sharp } from 'sharp';

import { BadInputError, ValidationError, ValidationErrorCode } from './error';
import { Platform } from './platform';

export const DEFAULT_RESOURCES_DIRECTORY = 'resources';

export const enum ResourceType {
  ADAPTIVE_ICON= 'adaptive-icon',
  ICON = 'icon',
  SPLASH = 'splash',
}

export const RESOURCE_TYPES: ReadonlyArray<ResourceType> = [
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
  image: ImageSourceData;
}

export interface ResolvedColorSource extends ColorSource {
  name: string;
}

export type ResolvedSource = ResolvedImageSource | ResolvedColorSource;

export const RESOURCE_FORMATS: ReadonlyArray<Format> = [Format.JPEG, Format.PNG];
export const RESOURCE_RASTER_FORMATS: ReadonlyArray<Format> = [Format.JPEG, Format.PNG];

export type ResourceValidator = (source: string, pipeline: Sharp) => Promise<Metadata>;

export function isResourceFormat(format: any): format is Format {
  return RESOURCE_FORMATS.includes(format);
}

export function isRasterResourceFormat(format: any): format is Format {
  return RESOURCE_RASTER_FORMATS.includes(format);
}

async function rasterResourceValidator(type: ResourceType, source: string, pipeline: Sharp, dimensions: [number, number]): Promise<Metadata> {
  const metadata = await pipeline.metadata();

  const { format, width, height } = metadata;
  const [ requiredWidth, requiredHeight ] = dimensions;

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

  return metadata;
}

export const COLOR_REGEX = /^\#[A-F0-9]{6}$/;

export const RASTER_RESOURCE_VALIDATORS: { readonly [T in ResourceType]: ResourceValidator; } = {
  [ResourceType.ADAPTIVE_ICON]: async (source, pipeline) => rasterResourceValidator(ResourceType.ADAPTIVE_ICON, source, pipeline, [432, 432]),
  [ResourceType.ICON]: async (source, pipeline) => rasterResourceValidator(ResourceType.ICON, source, pipeline, [1024, 1024]),
  [ResourceType.SPLASH]: async (source, pipeline) => rasterResourceValidator(ResourceType.SPLASH, source, pipeline, [2732, 2732]),
};

export const enum Format {
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
}

export interface ResourcesImageConfig {
  readonly [ResourceKey.SRC]: string;
  readonly [ResourceKey.FORMAT]: Format;
  readonly [ResourceKey.WIDTH]: number;
  readonly [ResourceKey.HEIGHT]: number;
  readonly [ResourceKey.DENSITY]?: Density;
  readonly [ResourceKey.ORIENTATION]?: Orientation;
}

export interface AndroidAdaptiveIconConfig {
  readonly [ResourceKey.FOREGROUND]: string;
  readonly [ResourceKey.BACKGROUND]: string;
  readonly [ResourceKey.FORMAT]: Format;
  readonly [ResourceKey.WIDTH]: number;
  readonly [ResourceKey.HEIGHT]: number;
  readonly [ResourceKey.DENSITY]?: Density;
}

export interface ResourcesTypeConfig<C = ResourcesImageConfig> {
  readonly resources: ReadonlyArray<C>;
  readonly nodeName: string;
  readonly nodeAttributes: ReadonlyArray<ResourceKey>;
}

export type ResourcesPlatform = { readonly [T in ResourceType.ICON | ResourceType.SPLASH]: ResourcesTypeConfig; };
export type ResourcesConfig = { readonly [P in Platform]: ResourcesPlatform; };

export function validateResourceTypes(types: ReadonlyArray<string>): ResourceType[] {
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

export function getResourcesConfig(platform: Platform.ANDROID, type: ResourceType.ADAPTIVE_ICON): ResourcesTypeConfig<AndroidAdaptiveIconConfig>;
export function getResourcesConfig(platform: Platform, type: ResourceType): ResourcesTypeConfig;
export function getResourcesConfig(platform: Platform, type: ResourceType): ResourcesTypeConfig | ResourcesTypeConfig<AndroidAdaptiveIconConfig> {
  if (type === ResourceType.ADAPTIVE_ICON) {
    return {
      resources: [
        { foreground: 'android/icon/ldpi-foreground.png', background: 'android/icon/ldpi-background.png', format: Format.PNG, width: 81, height: 81, density: Density.LDPI },
        { foreground: 'android/icon/mdpi-foreground.png', background: 'android/icon/mdpi-background.png', format: Format.PNG, width: 108, height: 108, density: Density.MDPI },
        { foreground: 'android/icon/hdpi-foreground.png', background: 'android/icon/hdpi-background.png', format: Format.PNG, width: 162, height: 162, density: Density.HDPI },
        { foreground: 'android/icon/xhdpi-foreground.png', background: 'android/icon/xhdpi-background.png', format: Format.PNG, width: 216, height: 216, density: Density.XHDPI },
        { foreground: 'android/icon/xxhdpi-foreground.png', background: 'android/icon/xxhdpi-background.png', format: Format.PNG, width: 324, height: 324, density: Density.XXHDPI },
        { foreground: 'android/icon/xxxhdpi-foreground.png', background: 'android/icon/xxxhdpi-background.png', format: Format.PNG, width: 432, height: 432, density: Density.XXXHDPI },
      ],
      nodeName: 'icon',
      nodeAttributes: [ResourceKey.FOREGROUND, ResourceKey.DENSITY, ResourceKey.BACKGROUND],
    };
  }

  return RESOURCES[platform][type];
}

const RESOURCES: ResourcesConfig = {
  [Platform.ANDROID]: {
    [ResourceType.ICON]: {
      resources: [
        { src: 'android/icon/drawable-ldpi-icon.png', format: Format.PNG, width: 36, height: 36, density: Density.LDPI },
        { src: 'android/icon/drawable-mdpi-icon.png', format: Format.PNG, width: 48, height: 48, density: Density.MDPI },
        { src: 'android/icon/drawable-hdpi-icon.png', format: Format.PNG, width: 72, height: 72, density: Density.HDPI },
        { src: 'android/icon/drawable-xhdpi-icon.png', format: Format.PNG, width: 96, height: 96, density: Density.XHDPI },
        { src: 'android/icon/drawable-xxhdpi-icon.png', format: Format.PNG, width: 144, height: 144, density: Density.XXHDPI },
        { src: 'android/icon/drawable-xxxhdpi-icon.png', format: Format.PNG, width: 192, height: 192, density: Density.XXXHDPI },
      ],
      nodeName: 'icon',
      nodeAttributes: [ResourceKey.SRC, ResourceKey.DENSITY],
    },
    [ResourceType.SPLASH]: {
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
      nodeName: 'splash',
      nodeAttributes: [ResourceKey.SRC, ResourceKey.DENSITY],
    },
  },
  [Platform.IOS]: {
    [ResourceType.ICON]: {
      resources: [
        { src: 'ios/icon/icon.png', format: Format.PNG, width: 57, height: 57 },
        { src: 'ios/icon/icon@2x.png', format: Format.PNG, width: 114, height: 114 },
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
      nodeName: 'icon',
      nodeAttributes: [ResourceKey.SRC, ResourceKey.WIDTH, ResourceKey.HEIGHT],
    },
    [ResourceType.SPLASH]: {
      resources: [
        { src: 'ios/splash/Default-568h@2x~iphone.png', format: Format.PNG, width: 640, height: 1136, orientation: Orientation.PORTRAIT },
        { src: 'ios/splash/Default-667h.png', format: Format.PNG, width: 750, height: 1334, orientation: Orientation.PORTRAIT },
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
      nodeName: 'splash',
      nodeAttributes: [ResourceKey.SRC, ResourceKey.WIDTH, ResourceKey.HEIGHT],
    },
  },
};
