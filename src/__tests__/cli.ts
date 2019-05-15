import { generateRunOptions } from '../cli';
import { Platform } from '../platform';

describe('cordova-res', () => {

  describe('cli', () => {

    describe('generateRunOptions', () => {

      it('should provide defaults with no args', async () => {
        expect(generateRunOptions(Platform.ANDROID, 'resources', [])).toEqual({
          'adaptive-icon': {
            foreground: { sources: ['resources/android/icon-foreground.png', 'resources/android/icon-foreground.jpg', 'resources/android/icon-foreground.jpeg'] },
            background: { sources: ['resources/android/icon-background.png', 'resources/android/icon-background.jpg', 'resources/android/icon-background.jpeg'] },
          },
          icon: { sources: ['resources/android/icon.png', 'resources/android/icon.jpg', 'resources/android/icon.jpeg', 'resources/icon.png', 'resources/icon.jpg', 'resources/icon.jpeg'] },
          splash: { sources: ['resources/android/splash.png', 'resources/android/splash.jpg', 'resources/android/splash.jpeg', 'resources/splash.png', 'resources/splash.jpg', 'resources/splash.jpeg'] },
        });
      });

      it('should override source image paths', async () => {
        expect(generateRunOptions(Platform.IOS, 'resources', ['--icon-source', 'foo.png', '--splash-source', 'bar.png'])).toEqual({
          icon: { sources: ['foo.png'] },
          splash: { sources: ['bar.png'] },
        });
      });

    });

  });

});
