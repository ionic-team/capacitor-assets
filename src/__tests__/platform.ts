import * as path from 'path';

import { Platform } from '../platform';
import { ResourceType, getResourcesConfig } from '../resources';

describe('cordova-res', () => {

  describe('platform', () => {

    describe('run', () => {

      let platform: typeof import('../platform');
      let fsMock: { [key: string]: jest.Mock };
      let imageMock: { [key: string]: jest.Mock };

      beforeEach(async () => {
        jest.resetModules();

        fsMock = {
          ensureDir: jest.fn(),
        };

        imageMock = {
          resolveSourceImage: jest.fn(),
          generateImage: jest.fn(),
        };

        jest.mock('@ionic/utils-fs', () => fsMock);
        jest.mock('../image', () => imageMock);

        platform = await import('../platform');
      });

      it('should run through android icons with successful result', async () => {
        const pipeline: any = { clone: jest.fn(() => pipeline) };
        imageMock.resolveSourceImage.mockImplementation(async () => ({ src: 'test.png', image: { src: 'test.png', pipeline, metadata: {} } }));

        const result = await platform.run(Platform.ANDROID, 'resources', {
          [ResourceType.ICON]: { sources: ['icon.png'] },
        }, null);

        const generatedImages = getResourcesConfig(Platform.ANDROID, ResourceType.ICON).resources;

        expect(imageMock.resolveSourceImage).toHaveBeenCalledTimes(1);
        expect(imageMock.resolveSourceImage).toHaveBeenCalledWith('android', 'icon', ['icon.png'], null);
        expect(imageMock.generateImage).toHaveBeenCalledTimes(generatedImages.length);

        for (const generatedImage of generatedImages) {
          expect(imageMock.generateImage).toHaveBeenCalledWith(
            {
              src: path.join('resources', generatedImage.src),
              format: generatedImage.format,
              width: generatedImage.width,
              height: generatedImage.height,
            },
            expect.anything(),
            expect.anything(),
            null
          );
        }

        expect(result.resources.length).toEqual(generatedImages.length);
      });

      it('should run through windows icons with successful result', async () => {
        const pipeline: any = { clone: jest.fn(() => pipeline) };
        imageMock.resolveSourceImage.mockImplementation(async () => ({ src: 'test.png', image: { src: 'test.png', pipeline, metadata: {} } }));

        const result = await platform.run(Platform.WINDOWS, 'resources', {
          [ResourceType.ICON]: { sources: ['icon.png'] },
        }, null);

        const generatedImages = getResourcesConfig(Platform.WINDOWS, ResourceType.ICON).resources;

        expect(imageMock.resolveSourceImage).toHaveBeenCalledTimes(1);
        expect(imageMock.resolveSourceImage).toHaveBeenCalledWith('windows', 'icon', ['icon.png'], null);
        expect(imageMock.generateImage).toHaveBeenCalledTimes(generatedImages.length);

        for (const generatedImage of generatedImages) {
          expect(imageMock.generateImage).toHaveBeenCalledWith(
              {
                src: path.join('resources', generatedImage.src),
                format: generatedImage.format,
                width: generatedImage.width,
                height: generatedImage.height,
              },
              expect.anything(),
              expect.anything(),
              null
          );
        }

        expect(result.resources.length).toEqual(generatedImages.length);
      });

    });

    describe('isSupportedPlatform', () => {

      let isSupportedPlatform: typeof import('../platform').isSupportedPlatform;

      beforeEach(async () => {
        ({ isSupportedPlatform } = await import('../platform'));
      });

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
