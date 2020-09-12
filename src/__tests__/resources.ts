import { Platform } from '../platform';
import type { ResourceConfig } from '../resources';
import {
  Format,
  Target,
  ResourceType,
  generateScaledWindowsResource,
  isSupportedResourceType,
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
      const resource: ResourceConfig = {
        platform: Platform.WINDOWS,
        type: ResourceType.ICON,
        src: 'dir/icon.png',
        width: 100,
        height: 100,
        format: Format.NONE,
        target: Target.STORE_LOGO,
        scale: 1,
      };

      it('should generate scaled resource with proper src and format', () => {
        const expected = {
          platform: Platform.WINDOWS,
          type: ResourceType.ICON,
          src: 'dir/icon.scale-150.png',
          width: 150,
          height: 150,
          format: Format.PNG,
          target: undefined,
          scale: 1.5,
        };

        expect(generateScaledWindowsResource(resource, 1.5)).toEqual(expected);
      });

      it('should not allow scaled resource', () => {
        expect(() =>
          generateScaledWindowsResource({ ...resource, scale: 2 }, 1.5),
        ).toThrowError('from scaled resource');
      });
    });
  });
});
