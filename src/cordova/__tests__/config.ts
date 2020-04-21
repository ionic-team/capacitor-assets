import * as et from 'elementtree';

import { runResource } from '../config';
import { GeneratedResource, Platform } from '../../platform';
import { ResourceKey, ResourceNodeAttributeType, ResourceType } from '../../resources';

const SRC_ATTRIBUTE = { key: ResourceKey.SRC, type: ResourceNodeAttributeType.PATH };

describe('cordova-res', () => {

  describe('cordova/config', () => {

    describe('runResource', () => {

      const resource: GeneratedResource = {
        [ResourceKey.SRC]: 'resources/icon.png',
        type: ResourceType.ICON,
        platform: Platform.ANDROID,
        configXml: {
          nodeName: 'icon',
          nodeAttributes: [SRC_ATTRIBUTE],
          xpaths: resource => [`icon[@src='${resource.src}']`, `icon[@src='${resource.src!.replace(/\//g, '\\')}']`],
          included: () => true,
        },
      };

      it('should insert node for empty container', async () => {
        const src = 'resources/icon.png';
        const container = et.Element('platform');

        runResource(container, resource);

        const children = container.findall('icon');
        expect(children.length).toEqual(1);
        expect(children[0].tag).toEqual(resource.configXml.nodeName);
        expect(children[0].get('src')).toEqual(src);
      });

      it('should not change node if found in container', async () => {
        const src = 'resources/icon.png';
        const container = et.Element('platform');
        et.SubElement(container, 'icon', { src });

        runResource(container, resource);

        const children = container.findall('icon');
        expect(children.length).toEqual(1);
        expect(children[0].tag).toEqual(resource.configXml.nodeName);
        expect(children[0].get('src')).toEqual(src);
      });

      it('should update node with win32 paths', async () => {
        const src = 'resources/icon.png';
        const container = et.Element('platform');
        et.SubElement(container, 'icon', { src: 'resources\\icon.png' });

        runResource(container, resource);

        const children = container.findall('icon');
        expect(children.length).toEqual(1);
        expect(children[0].tag).toEqual(resource.configXml.nodeName);
        expect(children[0].get('src')).toEqual(src);
      });

    });

  });

});
