import { generateScaledWindowsResource, isSupportedResourceType, Format } from '../resources';

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
        const resource = { src: 'dir/icon.png', width: 100, height: 100, format: Format.NONE, target: 'target', };
        const expected = { src: 'dir/icon.scale-150.png', width: 150, height: 150, format: Format.PNG };

        expect(generateScaledWindowsResource(resource, 1.5)).toEqual(expected);
      });

    });

  });

});
