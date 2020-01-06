import { ensureDir, readFile, writeFile } from '@ionic/utils-fs';
import Debug from 'debug';
import et from 'elementtree';
import pathlib from 'path';

import { BadInputError } from './error';
import { GeneratedResource, Platform } from './platform';
import { ResolvedColorSource, ResolvedSource, ResourceNodeAttribute, ResourceNodeAttributeType, SourceType } from './resources';

const debug = Debug('cordova-res:config');

export function getConfigPath(directory: string): string {
  return pathlib.resolve(directory, 'config.xml');
}

export async function run(configPath: string, resourcesDirectory: string, doc: et.ElementTree, sources: readonly ResolvedSource[], resources: readonly GeneratedResource[], errstream?: NodeJS.WritableStream): Promise<void> {
  const colors = sources.filter((source): source is ResolvedColorSource => source.type === SourceType.COLOR);

  if (colors.length > 0) {
    debug('Color sources found--generating colors document.');

    const androidPlatformElement = resolvePlatformElement(doc.getroot(), Platform.ANDROID);

    const colorsPath = pathlib.join(resourcesDirectory, 'values', 'colors.xml');
    await runColorsConfig(colorsPath, colors);

    let resourceFileElement = androidPlatformElement.find(`resource-file[@src='${colorsPath}']`);

    if (!resourceFileElement) {
      resourceFileElement = et.SubElement(androidPlatformElement, 'resource-file');
    }

    resourceFileElement.set('src', colorsPath);
    resourceFileElement.set('target', '/app/src/main/res/values/colors.xml');
  }

  runConfig(configPath, doc, resources, errstream);
}

export async function resolveColorsDocument(colorsPath: string): Promise<et.ElementTree> {
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

export async function runColorsConfig(colorsPath: string, colors: readonly ResolvedColorSource[]): Promise<void> {
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

export function runConfig(configPath: string, doc: et.ElementTree, resources: readonly GeneratedResource[], errstream?: NodeJS.WritableStream): void {
  const root = doc.getroot();
  const orientationPreference = getPreference(root, 'Orientation');
  debug('Orientation preference: %O', orientationPreference);

  const orientation = orientationPreference || 'default';

  if (orientation !== 'default' && errstream) {
    errstream.write(`WARN: Orientation preference set to '${orientation}'. Only configuring ${orientation} resources.\n`);
  }

  const platforms = groupImages(resources);

  for (const [ platform, platformResources ] of platforms) {
    const platformElement = resolvePlatformElement(root, platform);
    let filteredResources = platformResources.filter(img => orientation === 'default' || typeof img.orientation === 'undefined' || img.orientation === orientation);
    if (platform === Platform.WINDOWS) {
      filteredResources = filteredResources.filter(img => typeof img.target === 'string');
    }
    for (const resource of filteredResources) {
      runResource(configPath, platformElement, resource);
    }
  }
}

export function conformPath(configPath: string, value: string | number): string {
  return pathlib.relative(pathlib.dirname(configPath), value.toString()).replace(/\\/g, '/');
}

export function runResource(configPath: string, container: et.Element, resource: GeneratedResource): void {
  const src = resource[resource.indexAttribute.key];

  if (typeof src !== 'string') {
    throw new BadInputError(`Bad value for index "${resource.indexAttribute.key}": ${src}`);
  }

  // We force the use of forward slashes here to provide cross-platform
  // compatibility for paths.
  const imgElement = resolveResourceElement(container, resource.nodeName, resource.indexAttribute, conformPath(configPath, src));

  for (const attr of resource.nodeAttributes) {
    const v = resource[attr.key];

    if (v) {
      imgElement.set(attr.key, attr.type === ResourceNodeAttributeType.PATH ? conformPath(configPath, v) : v.toString());
    }
  }
}

export function resolvePlatformElement(container: et.Element, platform: Platform): et.Element {
  const platformElement = container.find(`platform[@name='${platform}']`);

  if (platformElement) {
    return platformElement;
  }

  debug('Creating node for %o', platform);
  return et.SubElement(container, 'platform', { name: platform });
}

export function resolveResourceElement(container: et.Element, nodeName: string, indexAttr: ResourceNodeAttribute, index: string): et.Element {
  const imgElement = container.find(`${nodeName}[@${indexAttr.key}='${index}']`);

  if (imgElement) {
    return imgElement;
  }

  if (indexAttr.type === ResourceNodeAttributeType.PATH) {
    // We didn't find the element using forward slashes, so let's try to
    // find it with backslashes if the index is a path.
    const imgElementByBackslashes = container.find(`${nodeName}[@${indexAttr.key}='${index.replace(/\//g, '\\')}']`);

    if (imgElementByBackslashes) {
      return imgElementByBackslashes;
    }
  }

  debug('Creating %O node for %o', nodeName, index);
  return et.SubElement(container, nodeName);
}

export function groupImages(images: readonly GeneratedResource[]): Map<Platform, GeneratedResource[]> {
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

export function getPreference(container: et.Element, name: string): string | undefined {
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
