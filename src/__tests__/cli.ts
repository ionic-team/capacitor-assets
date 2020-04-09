import * as et from 'elementtree';

import { Options } from '..';
import { generateRunOptions, parseOptions, resolveOptions } from '../cli';
import { Platform } from '../platform';

function generatePlatformsConfig(resourcesDirectory: string) {
  return {
    android: {
      'adaptive-icon': {
        background: {
          sources: [
            `${resourcesDirectory}/android/icon-background.png`,
            `${resourcesDirectory}/android/icon-background.jpg`,
            `${resourcesDirectory}/android/icon-background.jpeg`,
          ],
        },
        foreground: {
          sources: [
            `${resourcesDirectory}/android/icon-foreground.png`,
            `${resourcesDirectory}/android/icon-foreground.jpg`,
            `${resourcesDirectory}/android/icon-foreground.jpeg`,
          ],
        },
        icon: {
          sources: [
            `${resourcesDirectory}/android/icon.png`,
            `${resourcesDirectory}/android/icon.jpg`,
            `${resourcesDirectory}/android/icon.jpeg`,
            `${resourcesDirectory}/icon.png`,
            `${resourcesDirectory}/icon.jpg`,
            `${resourcesDirectory}/icon.jpeg`,
          ],
        },
      },
      icon: {
        sources: [
          `${resourcesDirectory}/android/icon.png`,
          `${resourcesDirectory}/android/icon.jpg`,
          `${resourcesDirectory}/android/icon.jpeg`,
          `${resourcesDirectory}/icon.png`,
          `${resourcesDirectory}/icon.jpg`,
          `${resourcesDirectory}/icon.jpeg`,
        ],
      },
      splash: {
        sources: [
          `${resourcesDirectory}/android/splash.png`,
          `${resourcesDirectory}/android/splash.jpg`,
          `${resourcesDirectory}/android/splash.jpeg`,
          `${resourcesDirectory}/splash.png`,
          `${resourcesDirectory}/splash.jpg`,
          `${resourcesDirectory}/splash.jpeg`,
        ],
      },
    },
    ios: {
      icon: {
        sources: [
          `${resourcesDirectory}/ios/icon.png`,
          `${resourcesDirectory}/ios/icon.jpg`,
          `${resourcesDirectory}/ios/icon.jpeg`,
          `${resourcesDirectory}/icon.png`,
          `${resourcesDirectory}/icon.jpg`,
          `${resourcesDirectory}/icon.jpeg`,
        ],
      },
      splash: {
        sources: [
          `${resourcesDirectory}/ios/splash.png`,
          `${resourcesDirectory}/ios/splash.jpg`,
          `${resourcesDirectory}/ios/splash.jpeg`,
          `${resourcesDirectory}/splash.png`,
          `${resourcesDirectory}/splash.jpg`,
          `${resourcesDirectory}/splash.jpeg`,
        ],
      },
    },
    windows: {
      icon: {
        sources: [
          `${resourcesDirectory}/windows/icon.png`,
          `${resourcesDirectory}/windows/icon.jpg`,
          `${resourcesDirectory}/windows/icon.jpeg`,
          `${resourcesDirectory}/icon.png`,
          `${resourcesDirectory}/icon.jpg`,
          `${resourcesDirectory}/icon.jpeg`,
        ],
      },
      splash: {
        sources: [
          `${resourcesDirectory}/windows/splash.png`,
          `${resourcesDirectory}/windows/splash.jpg`,
          `${resourcesDirectory}/windows/splash.jpeg`,
          `${resourcesDirectory}/splash.png`,
          `${resourcesDirectory}/splash.jpg`,
          `${resourcesDirectory}/splash.jpeg`,
        ],
      },
    },
  };
}

describe('cordova-res', () => {

  describe('cli', () => {

    describe('parseOptions', () => {

      const DEFAULT_OPTIONS: Options = {
        directory: process.cwd(),
        logstream: process.stdout,
        errstream: process.stderr,
        resourcesDirectory: 'resources',
        platforms: generatePlatformsConfig('resources'),
        projectConfig: {
          android: { directory: 'android' },
          ios: { directory: 'ios' },
          windows: { directory: 'windows' },
        },
        skipConfig: false,
        copy: false,
      };

      it('should parse default options with no arguments', () => {
        const result = parseOptions([]);
        expect(result).toEqual(DEFAULT_OPTIONS);
      });

      it('should parse options for android', () => {
        const args = ['android'];
        const result = parseOptions(args);
        expect(result).toEqual({ ...DEFAULT_OPTIONS, platforms: { android: generateRunOptions(Platform.ANDROID, 'resources', args), }, projectConfig: { android: { directory: 'android' } } });
      });

      it('should parse default options when the first argument is not a platform', () => {
        const args = ['--help', 'android'];
        const result = parseOptions(args);
        expect(result).toEqual(DEFAULT_OPTIONS);
      });

      it('should accept --resources flag', () => {
        const args = ['--resources', 'res'];
        const result = parseOptions(args);
        expect(result).toEqual({ ...DEFAULT_OPTIONS, platforms: generatePlatformsConfig('res'), resourcesDirectory: 'res' });
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

    describe('resolveOptions', () => {

      it('should pull platforms from config.xml if none provided', async () => {

        const configXml: et.Element = et.Element('widget');
        configXml.append(et.Element('platform', { name: 'android' }));
        configXml.append(et.Element('platform', { name: 'ios' }));

        const options: Options = await resolveOptions([], 'resources', new et.ElementTree(configXml));

        expect(options.platforms).toEqual({
          ...generatePlatformsConfig('resources'),
          windows: undefined,
        });
      });

      it('should use runtime platform if provided', async () => {

        const configXml: et.Element = et.Element('widget');
        configXml.append(et.Element('platform', { name: 'android' }));
        configXml.append(et.Element('platform', { name: 'ios' }));

        const options: Options = await resolveOptions(['android'], 'resources', new et.ElementTree(configXml));

        expect(options.platforms).toEqual({
          ...generatePlatformsConfig('resources'),
          windows: undefined,
          ios: undefined,
        });
      });

      it('should generate for all platforms if no config.xml and no runtime platform', async () => {

        const configXml: et.Element = et.Element('widget');
        configXml.append(et.Element('platform', { name: 'android' }));
        configXml.append(et.Element('platform', { name: 'ios' }));

        const options: Options = await resolveOptions(['android'], 'resources', new et.ElementTree(configXml));

        expect(options.platforms).toEqual({
          ...generatePlatformsConfig('resources'),
          windows: undefined,
          ios: undefined,
        });
      });

    });

  });

});
