import { generateRunOptions } from '../';
import { Platform } from '../platform';

describe('cordova-res', () => {

  describe('index', () => {

    describe('generateRunOptions', () => {

      it('should provide defaults with no args', async () => {
        expect(generateRunOptions(Platform.ANDROID, [])).toEqual({
          icon: { sources: ['resources/android/icon.png', 'resources/icon.png'] },
          splash: { sources: ['resources/android/splash.png', 'resources/splash.png'] },
        });
      });

      it('should override source image paths', async () => {
        expect(generateRunOptions(Platform.IOS, ['--icon-source', 'foo.png', '--splash-source', 'bar.png'])).toEqual({
          icon: { sources: ['foo.png'] },
          splash: { sources: ['bar.png'] },
        });
      });

    });

  });

});
