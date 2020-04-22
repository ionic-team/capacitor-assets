import { ensureDir, readFile, writeFile } from '@ionic/utils-fs';
import Debug from 'debug';
import et from 'elementtree';
import pathlib from 'path';
import util from 'util';

import { GeneratedResource, Platform } from '../platform';
import {
  ResolvedColorSource,
  ResolvedSource,
  ResourceNodeAttribute,
  ResourceNodeAttributeType,
  SourceType,
} from '../resources';

const debug = Debug('cordova-res:cordova:config');

export function getConfigPath(directory: string): string {
  return pathlib.resolve(directory, 'config.xml');
}

export async function run(
  resourcesDirectory: string,
  doc: et.ElementTree,
  sources: readonly ResolvedSource[],
  resources: readonly GeneratedResource[],
  errstream: NodeJS.WritableStream | null,
): Promise<void> {
  const colors = sources.filter(
    (source): source is ResolvedColorSource => source.type === SourceType.COLOR,
  );

  if (colors.length > 0) {
    debug('Color sources found--generating colors document.');

    const androidPlatformElement = resolvePlatformElement(
      doc.getroot(),
      Platform.ANDROID,
    );

    const colorsPath = pathlib.join(resourcesDirectory, 'values', 'colors.xml');
    await runColorsConfig(colorsPath, colors);

    const resourceFileElement = resolveElement(
      androidPlatformElement,
      'resource-file',
      [`resource-file[@src='${colorsPath}']`],
    );

    resourceFileElement.set('src', colorsPath);
    resourceFileElement.set('target', '/app/src/main/res/values/colors.xml');
  }

  runConfig(doc, resources, errstream);
}

export async function resolveColorsDocument(
  colorsPath: string,
): Promise<et.ElementTree> {
  try {
    return await read(colorsPath);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }

    const element = et.Element('resources');
    return new et.ElementTree(element);
  }
}

export async function runColorsConfig(
  colorsPath: string,
  colors: readonly ResolvedColorSource[],
): Promise<void> {
  await ensureDir(pathlib.dirname(colorsPath));
  const colorsDocument = await resolveColorsDocument(colorsPath);
  const root = colorsDocument.getroot();

  for (const color of colors) {
    let colorElement = root.find(`color[@name='${color.name}']`);

    if (!colorElement) {
      debug('Creating node for %o', color.name);
      colorElement = et.SubElement(root, 'color');
    }

    colorElement.set('name', color.name);
    colorElement.text = color.color;
  }

  await write(colorsPath, colorsDocument);
}

export function runConfig(
  doc: et.ElementTree,
  resources: readonly GeneratedResource[],
  errstream: NodeJS.WritableStream | null,
): void {
  const root = doc.getroot();
  const orientationPreference = getPreference(root, 'Orientation');
  debug('Orientation preference: %O', orientationPreference);

  const orientation = orientationPreference || 'default';

  if (orientation !== 'default') {
    errstream?.write(
      util.format(
        `WARN:\tOrientation preference set to '%s'. Only configuring %s resources.`,
        orientation,
        orientation,
      ) + '\n',
    );
  }

  const platforms = groupImages(resources);

  for (const [platform, platformResources] of platforms) {
    const platformElement = resolvePlatformElement(root, platform);
    const filteredResources = platformResources
      .filter(
        img =>
          orientation === 'default' ||
          typeof img.orientation === 'undefined' ||
          img.orientation === orientation,
      )
      .filter(img => img.configXml.included(img));

    for (const resource of filteredResources) {
      runResource(platformElement, resource);
    }
  }
}

export function runResource(
  container: et.Element,
  resource: GeneratedResource,
): void {
  const { nodeName, nodeAttributes, xpaths } = resource.configXml;

  const imgElement = resolveElement(container, nodeName, xpaths(resource));

  for (const attr of nodeAttributes) {
    const v = resolveAttribute(resource, attr);

    if (v) {
      imgElement.set(attr.key, v);
    }
  }
}

export function resolvePlatformElement(
  container: et.Element,
  platform: Platform,
): et.Element {
  const platformElement = resolveElement(container, 'platform', [
    `platform[@name='${platform}']`,
  ]);
  platformElement.set('name', platform);

  return platformElement;
}

/**
 * Query a container for a subelement and create it if it doesn't exist
 */
export function resolveElement(
  container: et.Element,
  nodeName: string,
  xpaths: string[],
): et.Element {
  for (const xpath of xpaths) {
    const imgElement = container.find(xpath);

    if (imgElement) {
      return imgElement;
    }
  }

  debug('Creating %O node (not found by xpaths: %O)', nodeName, xpaths);
  return et.SubElement(container, nodeName);
}

export function conformPath(value: string | number): string {
  return value.toString().replace(/\\/g, '/');
}

export function resolveAttributeValue(
  attr: ResourceNodeAttribute,
  value: string | number,
): string {
  return attr.type === ResourceNodeAttributeType.PATH
    ? conformPath(value)
    : value.toString();
}

export function resolveAttribute(
  resource: GeneratedResource,
  attr: ResourceNodeAttribute,
): string | undefined {
  const v = resource[attr.key];

  if (v) {
    return resolveAttributeValue(attr, v);
  }
}

export function groupImages(
  images: readonly GeneratedResource[],
): Map<Platform, GeneratedResource[]> {
  const platforms = new Map<Platform, GeneratedResource[]>();

  for (const image of images) {
    let platformImages = platforms.get(image.platform);

    if (!platformImages) {
      platformImages = [];
    }

    platformImages.push(image);
    platforms.set(image.platform, platformImages);
  }

  return platforms;
}

export async function read(path: string): Promise<et.ElementTree> {
  const contents = await readFile(path, 'utf8');
  const doc = et.parse(contents);

  return doc;
}

export async function write(path: string, doc: et.ElementTree): Promise<void> {
  // Cordova hard codes an indentation of 4 spaces, so we'll follow.
  const contents = doc.write({ indent: 4 });

  await writeFile(path, contents, 'utf8');
}

export function getPlatforms(container: et.Element): string[] {
  const platformElements = container.findall('platform');
  const platforms = platformElements.map(el => el.get('name'));

  return platforms.filter((p): p is string => typeof p === 'string');
}

export function getPreference(
  container: et.Element,
  name: string,
): string | undefined {
  const preferenceElement = container.find(`preference[@name='${name}']`);

  if (!preferenceElement) {
    return undefined;
  }

  const value = preferenceElement.get('value');

  if (!value) {
    return undefined;
  }

  return value;
}
