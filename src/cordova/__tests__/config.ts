import * as et from 'elementtree';

import { Platform } from '../../platform';
import type { ResourceConfig, ResourceValue } from '../../resources';
import { Density, Format, ResourceType, ResourceKey } from '../../resources';
import { identity } from '../../utils/fn';
import {
  getIndexAttributeXPathParts,
  getResourceXPaths,
  pathValues,
  runResource,
} from '../config';
import type { ResourceConfigXmlRules } from '../config';

describe('cordova-res', () => {
  describe('cordova/config', () => {
    const srcIndexAttribute = { key: ResourceKey.SRC, values: pathValues };
    const densityIndexAttribute = {
      key: ResourceKey.DENSITY,
      values: identity,
    };
    const widthIndexAttribute = {
      key: ResourceKey.WIDTH,
      values: (v: ResourceValue) =>
        typeof v === 'number' ? [v, v * 2, v * 3] : [],
    };
    const formatIndexAttribute = { key: ResourceKey.FORMAT };
    const configXml: ResourceConfigXmlRules = {
      nodeName: 'icon',
      nodeAttributes: [
        ResourceKey.SRC,
        ResourceKey.DENSITY,
        ResourceKey.WIDTH,
        ResourceKey.HEIGHT,
      ],
      indexAttributes: [srcIndexAttribute, widthIndexAttribute],
      included: () => true,
    };

    const resource: ResourceConfig = {
      platform: Platform.ANDROID,
      type: ResourceType.ICON,
      src: 'resources/icon.png',
      format: Format.PNG,
      width: 10,
      height: 10,
      density: Density.MDPI,
    };

    describe.skip('runResource', () => {
      it('should insert node for empty container', async () => {
        const src = 'resources/icon.png';
        const container = et.Element('platform');

        runResource(container, resource);

        const children = container.findall('icon');
        expect(children.length).toEqual(1);
        expect(children[0].tag).toEqual('icon');
        expect(children[0].get('src')).toEqual(src);
      });

      it('should not change node if found in container', async () => {
        const src = 'resources/icon.png';
        const container = et.Element('platform');
        et.SubElement(container, 'icon', { src });

        runResource(container, resource);

        const children = container.findall('icon');
        expect(children.length).toEqual(1);
        expect(children[0].tag).toEqual('icon');
        expect(children[0].get('src')).toEqual(src);
      });

      it('should update node with win32 paths', async () => {
        const src = 'resources/icon.png';
        const container = et.Element('platform');
        et.SubElement(container, 'icon', { src: 'resources\\icon.png' });

        runResource(container, resource);

        const children = container.findall('icon');
        expect(children.length).toEqual(1);
        expect(children[0].tag).toEqual('icon');
        expect(children[0].get('src')).toEqual(src);
      });
    });

    describe('getIndexAttributeXPathParts', () => {
      it('should not generate any xpath parts for an index not in nodeAttributes', () => {
        const expected: Format[] = [];

        expect(
          getIndexAttributeXPathParts(
            configXml,
            formatIndexAttribute,
            Format.PNG,
          ),
        ).toEqual(expected);
      });

      it('should generate xpath part for density without modifications', () => {
        const expected = [`[@density='${Density.MDPI}']`];

        expect(
          getIndexAttributeXPathParts(
            configXml,
            densityIndexAttribute,
            Density.MDPI,
          ),
        ).toEqual(expected);
      });

      it('should generate xpath parts accounting for backslashes for windows paths', () => {
        const expected = [
          `[@src='path/to/icon.png']`,
          `[@src='path\\to\\icon.png']`,
        ];

        expect(
          getIndexAttributeXPathParts(
            configXml,
            srcIndexAttribute,
            'path/to/icon.png',
          ),
        ).toEqual(expected);
      });
    });

    describe('getResourceXPaths', () => {
      it('should not generate any xpaths for indexes not in nodeAttributes', () => {
        const expected: string[] = [];

        expect(
          getResourceXPaths(
            { ...configXml, indexAttributes: [formatIndexAttribute] },
            resource,
          ),
        ).toEqual(expected);
      });

      it('should generate single xpath for density', () => {
        const expected: string[] = [`icon[@density='${Density.MDPI}']`];

        expect(
          getResourceXPaths(
            { ...configXml, indexAttributes: [densityIndexAttribute] },
            resource,
          ),
        ).toEqual(expected);
      });

      it('should get the xpaths for all combinations of indexes', () => {
        const paths = [
          `[@src='${resource.src}']`,
          `[@src='${resource.src.replace(/\//g, '\\')}']`,
        ];
        const widths = [`[@width='10']`, `[@width='20']`, `[@width='30']`];
        const expected = [
          `icon${paths[0]}${widths[0]}`,
          `icon${paths[0]}${widths[1]}`,
          `icon${paths[0]}${widths[2]}`,
          `icon${paths[1]}${widths[0]}`,
          `icon${paths[1]}${widths[1]}`,
          `icon${paths[1]}${widths[2]}`,
        ];

        expect(getResourceXPaths(configXml, resource)).toEqual(expected);
      });
    });
  });
});
