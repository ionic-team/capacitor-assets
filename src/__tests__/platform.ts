import { isSupportedPlatform } from '../platform';

describe('cordova-res', () => {

  describe('platform', () => {

    describe('isSupportedPlatform', () => {

      it('should support android', async () => {
        expect(isSupportedPlatform('android')).toEqual(true);
      });

      it('should support ios', async () => {
        expect(isSupportedPlatform('ios')).toEqual(true);
      });

      it('should not support garbage', async () => {
        expect(isSupportedPlatform('garbage')).toEqual(false);
      });

    });

  });

});
