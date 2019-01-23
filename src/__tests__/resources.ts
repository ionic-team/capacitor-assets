import { isSupportedResourceType } from '../resources';

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

  });

});
