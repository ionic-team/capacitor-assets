import { readFile, writeFile } from '@ionic/utils-fs';
import * as Debug from 'debug';
import * as et from 'elementtree';

import { GeneratedImage, Platform } from './platform';
import { ResourceKey } from './resources';

const debug = Debug('cordova-res:config');

export function run(images: ReadonlyArray<GeneratedImage>, doc: et.ElementTree): void {
  const root = doc.getroot();
  const orientation = getPreference(doc, 'Orientation') || 'default';
  const platforms = groupImages(images);

  for (const [ platform, platformImages ] of platforms) {
    let platformElement = root.find(`platform[@name='${platform}']`);

    if (!platformElement) {
      debug('Creating node for %o', platform);
      platformElement = et.SubElement(root, 'platform', { name: platform });
    }

    const filteredImages = platformImages.filter(img => orientation === 'default' || typeof img.orientation === 'undefined' || img.orientation === orientation);

    for (const image of filteredImages) {
      // We use forward slashes, (not path.join) here to provide cross-platform
      // compatibility for paths.
      let imgElement = platformElement.find(`${image.nodeName}[@src='${image.dest}']`);

      if (!imgElement) {
        imgElement = platformElement.find(`${image.nodeName}[@src='${image.dest.split('/').join('\\')}']`);
      }

      if (!imgElement) {
        debug('Creating %O node for %o', image.nodeName, image.dest);
        imgElement = et.SubElement(platformElement, image.nodeName);
      }

      for (const attr of image.nodeAttributes) {
        let v = image[attr];

        if (attr === ResourceKey.SRC) {
          v = image.dest;
        }

        if (v) {
          imgElement.set(attr, v.toString());
        }
      }
    }
  }
}

export function groupImages(images: ReadonlyArray<GeneratedImage>): Map<Platform, GeneratedImage[]> {
  const platforms = new Map<Platform, GeneratedImage[]>();

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
