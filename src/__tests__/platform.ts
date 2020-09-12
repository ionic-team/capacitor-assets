import * as path from 'path';

import type * as platform from '../platform';
import {
  Platform,
  isSupportedPlatform,
  getResourceDestination,
} from '../platform';
import { ResourceType, getSimpleResources } from '../resources';

describe('cordova-res', () => {
  describe('platform', () => {
    describe('run', () => {
      let pl: typeof platform;
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

        pl = await import('../platform');
      });

      it('should run through android icons with successful result', async () => {
        const pipeline: any = { clone: jest.fn(() => pipeline) };
        imageMock.resolveSourceImage.mockImplementation(async () => ({
          src: 'test.png',
          image: { src: 'test.png', pipeline, metadata: {} },
        }));

        const result = await pl.run(
          Platform.ANDROID,
          'resources',
          {
            [ResourceType.ICON]: { sources: ['icon.png'] },
          },
          {
            fit: 'cover',
            position: 'center',
            transform: (image, pipeline) => pipeline,
          },
          null,
        );

        const generatedImages = getSimpleResources(
          Platform.ANDROID,
          ResourceType.ICON,
        );

        expect(imageMock.resolveSourceImage).toHaveBeenCalledTimes(1);
        expect(imageMock.resolveSourceImage).toHaveBeenCalledWith(
          'android',
          'icon',
          ['icon.png'],
          null,
        );
        expect(imageMock.generateImage).toHaveBeenCalledTimes(
          generatedImages.length,
        );

        for (const generatedImage of generatedImages) {
          expect(imageMock.generateImage).toHaveBeenCalledWith(
            {
              src: path.join(
                'resources',
                generatedImage.platform,
                generatedImage.type,
                generatedImage.src,
              ),
              format: generatedImage.format,
              width: generatedImage.width,
              height: generatedImage.height,
              fit: 'cover',
              position: 'center',
            },
            expect.anything(),
            expect.anything(),
            null,
          );
        }

        expect(result.resources.length).toEqual(generatedImages.length);
      });

      it('should run through windows icons with successful result', async () => {
        const pipeline: any = { clone: jest.fn(() => pipeline) };
        imageMock.resolveSourceImage.mockImplementation(async () => ({
          src: 'test.png',
          image: { src: 'test.png', pipeline, metadata: {} },
        }));

        const result = await pl.run(
          Platform.WINDOWS,
          'resources',
          {
            [ResourceType.ICON]: { sources: ['icon.png'] },
          },
          {
            fit: 'cover',
            position: 'center',
            transform: (image, pipeline) => pipeline,
          },
          null,
        );

        const generatedImages = getSimpleResources(
          Platform.WINDOWS,
          ResourceType.ICON,
        );

        expect(imageMock.resolveSourceImage).toHaveBeenCalledTimes(1);
        expect(imageMock.resolveSourceImage).toHaveBeenCalledWith(
          'windows',
          'icon',
          ['icon.png'],
          null,
        );
        expect(imageMock.generateImage).toHaveBeenCalledTimes(
          generatedImages.length,
        );

        for (const generatedImage of generatedImages) {
          expect(imageMock.generateImage).toHaveBeenCalledWith(
            {
              src: path.join(
                'resources',
                generatedImage.platform,
                generatedImage.type,
                generatedImage.src,
              ),
              format: generatedImage.format,
              width: generatedImage.width,
              height: generatedImage.height,
              fit: 'cover',
              position: 'center',
            },
            expect.anything(),
            expect.anything(),
            null,
          );
        }

        expect(result.resources.length).toEqual(generatedImages.length);
      });
    });

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

    describe('getResourceDestination', () => {
      it('should generate dest for android icon', () => {
        const expected = 'resources/android/icon/drawable-mdpi-icon.png';

        expect(
          getResourceDestination(
            'resources',
            Platform.ANDROID,
            ResourceType.ICON,
            'drawable-mdpi-icon.png',
          ),
        ).toEqual(expected);
      });

      it('should generate dest for android adaptive icon', () => {
        const expected = 'resources/android/icon/mdpi-foreground.png';

        expect(
          getResourceDestination(
            'resources',
            Platform.ANDROID,
            ResourceType.ADAPTIVE_ICON,
            'mdpi-foreground.png',
          ),
        ).toEqual(expected);
      });
    });
  });
});
