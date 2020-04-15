import * as et from 'elementtree';

import { runResource } from '../cordova/config';
import { GeneratedResource, Platform } from '../platform';
import { ResourceKey, ResourceNodeAttributeType, ResourceType } from '../resources';

const SRC_ATTRIBUTE = { key: ResourceKey.SRC, type: ResourceNodeAttributeType.PATH };

describe('cordova-res', () => {

  describe('config', () => {

    describe('runResource', () => {

      const resource: GeneratedResource = {
        [ResourceKey.SRC]: '/path/to/resources/icon.png',
        type: ResourceType.ICON,
        platform: Platform.ANDROID,
        configXml: {
          nodeName: 'icon',
          nodeAttributes: [SRC_ATTRIBUTE],
          indexAttribute: SRC_ATTRIBUTE,
          included: true,
        },
      };

      it('should insert node for empty container', async () => {
        const src = 'resources/icon.png';
        const container = et.Element('platform');

        runResource('/path/to/config.xml', container, resource);

        const children = container.findall('icon');
        expect(children.length).toEqual(1);
        expect(children[0].tag).toEqual(resource.configXml.nodeName);
        expect(children[0].get('src')).toEqual(src);
      });

      it('should not change node if found in container', async () => {
        const src = 'resources/icon.png';
        const container = et.Element('platform');
        et.SubElement(container, 'icon', { src });

        runResource('/path/to/config.xml', container, resource);

        const children = container.findall('icon');
        expect(children.length).toEqual(1);
        expect(children[0].tag).toEqual(resource.configXml.nodeName);
        expect(children[0].get('src')).toEqual(src);
      });

      it('should update node with win32 paths', async () => {
        const src = 'resources/icon.png';
        const container = et.Element('platform');
        et.SubElement(container, 'icon', { src: 'resources\\icon.png' });

        runResource('/path/to/config.xml', container, resource);

        const children = container.findall('icon');
        expect(children.length).toEqual(1);
        expect(children[0].tag).toEqual(resource.configXml.nodeName);
        expect(children[0].get('src')).toEqual(src);
      });

    });

  });

});
