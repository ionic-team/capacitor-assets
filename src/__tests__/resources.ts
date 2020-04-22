import {
  Format,
  ResourceKey,
  generateScaledWindowsResource,
  isSupportedResourceType,
  xpathsForPathAttribute,
} from '../resources';

describe('cordova-res', () => {
  describe('resources', () => {
    describe('isSupportedResourceType', () => {
      it('should support icon', async () => {
        expect(isSupportedResourceType('icon')).toEqual(true);
      });

      it('should support splash', async () => {
        expect(isSupportedResourceType('splash')).toEqual(true);
      });

      it('should not support garbage', async () => {
        expect(isSupportedResourceType('garbage')).toEqual(false);
      });
    });

    describe('generateScaledWindowsResource', () => {
      it('should generate scaled resource with proper src and format', () => {
        const resource = {
          src: 'dir/icon.png',
          width: 100,
          height: 100,
          format: Format.NONE,
          target: 'target',
        };
        const expected = {
          src: 'dir/icon.scale-150.png',
          width: 150,
          height: 150,
          format: Format.PNG,
        };

        expect(generateScaledWindowsResource(resource, 1.5)).toEqual(expected);
      });
    });

    describe('xpathsForPathAttribute', () => {
      it('should not generate paths for non-strings', () => {
        const xpaths = xpathsForPathAttribute('icon', ResourceKey.SRC);
        const paths = xpaths({});

        expect(paths).toEqual([]);
      });

      it('should generate xpaths for posix and win32', () => {
        const xpaths = xpathsForPathAttribute('icon', ResourceKey.SRC);
        const src = 'path/to/icon.png';
        const paths = xpaths({ src });

        expect(paths).toEqual([
          `icon[@src='${src}']`,
          `icon[@src='${src.replace(/\//g, '\\')}']`,
        ]);
      });
    });
  });
});
