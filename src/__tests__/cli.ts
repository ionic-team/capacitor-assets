import { Options } from '..';
import { generateRunOptions, parseOptions } from '../cli';
import { Platform } from '../platform';

describe('cordova-res', () => {

  describe('cli', () => {

    describe('parseOptions', () => {

      const DEFAULT_OPTIONS: Options = {
        logstream: process.stdout,
        errstream: process.stderr,
        resourcesDirectory: 'resources',
      };

      it('should parse default options with no arguments', () => {
        const result = parseOptions([]);
        expect(result).toEqual(DEFAULT_OPTIONS);
      });

      it('should parse options for android', () => {
        const args = ['android'];
        const result = parseOptions(args);
        expect(result).toEqual({ ...DEFAULT_OPTIONS, platforms: { android: generateRunOptions(Platform.ANDROID, 'resources', args) } });
      });

      it('should parse default options when the first argument is not a platform', () => {
        const args = ['--help', 'android'];
        const result = parseOptions(args);
        expect(result).toEqual(DEFAULT_OPTIONS);
      });

      it('should accept --resources flag', () => {
        const args = ['--resources', 'res'];
        const result = parseOptions(args);
        expect(result).toEqual({ ...DEFAULT_OPTIONS, resourcesDirectory: 'res' });
      });

      it('should log to stderr with --json flag', () => {
        const args = ['--json'];
        const result = parseOptions(args);
        expect(result).toEqual({ ...DEFAULT_OPTIONS, logstream: process.stderr });
      });

    });

    describe('generateRunOptions', () => {

      it('should provide defaults with no args', async () => {
        expect(generateRunOptions(Platform.ANDROID, 'resources', [])).toEqual({
          'adaptive-icon': {
            icon: { sources: ['resources/android/icon.png', 'resources/android/icon.jpg', 'resources/android/icon.jpeg', 'resources/icon.png', 'resources/icon.jpg', 'resources/icon.jpeg'] },
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
