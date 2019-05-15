import { ensureDir, readFile, writeFile } from '@ionic/utils-fs';
import Debug from 'debug';
import et from 'elementtree';
import pathlib from 'path';

import { BadInputError } from './error';
import { GeneratedResource, Platform } from './platform';
import { ResolvedColorSource, ResolvedSource, ResourceType, SourceType } from './resources';

const debug = Debug('cordova-res:config');

export async function run(configPath: string, resourcesDirectory: string, sources: ReadonlyArray<ResolvedSource>, resources: ReadonlyArray<GeneratedResource>): Promise<void> {
  const colors = sources.filter((source): source is ResolvedColorSource => source.type === SourceType.COLOR);
  const config = await read(configPath);

  const androidPlatformElement = resolvePlatformElement(config.getroot(), Platform.ANDROID);

  if (colors.length > 0) {
    debug('Color sources found--generating colors document.');

    const colorsPath = pathlib.join(resourcesDirectory, 'values', 'colors.xml');
    await runColorsConfig(colorsPath, colors);

    let resourceFileElement = androidPlatformElement.find(`resource-file[@src='${colorsPath}']`);

    if (!resourceFileElement) {
      resourceFileElement = et.SubElement(androidPlatformElement, 'resource-file');
    }

    resourceFileElement.set('src', colorsPath);
    resourceFileElement.set('target', '/app/src/main/res/values/colors.xml');
  }

  if (resources.find(resource => resource.type === ResourceType.ADAPTIVE_ICON)) {
    debug('Adaptive Icon resources found--removing any regular icon nodes.');

    const regularIconElements = androidPlatformElement.findall('icon[@src]');

    for (const element of regularIconElements) {
      androidPlatformElement.remove(element);
    }
  } else {
    debug('No Adaptive Icon resources found--removing any adaptive icon nodes.');

    const regularIconElements = androidPlatformElement.findall('icon[@foreground]');

    for (const element of regularIconElements) {
      androidPlatformElement.remove(element);
    }
  }

  runConfig(configPath, resources, config);

  await write(configPath, config);
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

export async function runColorsConfig(colorsPath: string, colors: ReadonlyArray<ResolvedColorSource>): Promise<void> {
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

export function runConfig(configPath: string, resources: ReadonlyArray<GeneratedResource>, doc: et.ElementTree): void {
  const root = doc.getroot();
  const orientation = getPreference(doc, 'Orientation') || 'default';
  const platforms = groupImages(resources);

  for (const [ platform, platformResources ] of platforms) {
    const platformElement = resolvePlatformElement(root, platform);
    const filteredResources = platformResources.filter(img => orientation === 'default' || typeof img.orientation === 'undefined' || img.orientation === orientation);

    for (const resource of filteredResources) {
      runResource(configPath, resource, platformElement);
    }
  }
}

export function runResource(configPath: string, resource: GeneratedResource, container: et.Element): void {
  const src = resource[resource.srckey];

  if (typeof src !== 'string') {
    throw new BadInputError(`Bad value for src key: ${resource.srckey}`);
  }

  // We force the use of forward slashes here to provide cross-platform
  // compatibility for paths.
  const value = pathlib.relative(pathlib.dirname(configPath), src).replace(/\\/g, '/');
  const imgElement = resolveResourceElement(container, resource.nodeName, resource.srckey, value);

  for (const attr of resource.nodeAttributes) {
    const v = resource[attr];

    if (v) {
      imgElement.set(attr, v.toString());
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

export function resolveResourceElement(container: et.Element, nodeName: string, pathAttr: string, pathAttrValue: string): et.Element {
  const imgElement = container.find(`${nodeName}[@${pathAttr}='${pathAttrValue}']`);

  if (imgElement) {
    return imgElement;
  }

  // We didn't find the element using forward slashes, so let's try to
  // find it with backslashes.
  const imgElementByBackslashes = container.find(`${nodeName}[@${pathAttr}='${pathAttrValue.replace(/\//g, '\\')}']`);

  if (imgElementByBackslashes) {
    return imgElementByBackslashes;
  }

  debug('Creating %O node for %o', nodeName, pathAttrValue);
  return et.SubElement(container, nodeName);
}

export function groupImages(images: ReadonlyArray<GeneratedResource>): Map<Platform, GeneratedResource[]> {
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

export function getPreference(doc: et.ElementTree, name: string): string | undefined {
  const root = doc.getroot();
  const preferenceElement = root.find(`preference[@name='${name}']`);

  if (!preferenceElement) {
    return undefined;
  }

  const value = preferenceElement.get('value');

  if (!value) {
    return undefined;
  }

  return value;
}
