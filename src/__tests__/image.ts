import type * as image from '../image';
import { Platform } from '../platform';
import { ResourceType } from '../resources';
import { identity } from '../utils/fn';

describe('cordova-res', () => {
  describe('image', () => {
    describe('resolveSourceImage', () => {
      let im: typeof image;
      let fsMock: { [key: string]: jest.Mock };
      let resourcesMock: {
        validateResource: jest.Mock;
        prettyPlatform: (...args: any[]) => any;
        prettyResourceType: (...args: any[]) => any;
      };

      beforeEach(async () => {
        jest.resetModules();

        fsMock = {
          readFile: jest.fn(),
          writeFile: jest.fn(),
        };

        resourcesMock = {
          validateResource: jest.fn(),
          prettyPlatform: identity,
          prettyResourceType: identity,
        };

        jest.mock('@ionic/utils-fs', () => fsMock);
        jest.mock('../resources', () => resourcesMock);

        im = await import('../image');
      });

      it('should throw with empty array of source images', async () => {
        await expect(
          im.resolveSourceImage(Platform.ANDROID, ResourceType.ICON, [], null),
        ).rejects.toThrow('Missing valid source image');
        expect(fsMock.readFile).not.toHaveBeenCalled();
      });

      it('should throw with source image with error', async () => {
        fsMock.readFile.mockImplementation(async () => {
          throw new Error('err');
        });
        await expect(
          im.resolveSourceImage(
            Platform.ANDROID,
            ResourceType.ICON,
            ['blah.png'],
            null,
          ),
        ).rejects.toThrow('Missing valid source image');
        expect(fsMock.readFile).toHaveBeenCalledTimes(1);
      });

      it('should resolve with proper image', async () => {
        fsMock.readFile.mockImplementationOnce(async () => {
          throw new Error('err');
        });
        fsMock.readFile.mockImplementationOnce(async () =>
          Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
            0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x01, 0x03, 0x00, 0x00, 0x00, 0x66, 0xbc, 0x3a, 0x25,
            0x00, 0x00, 0x00, 0x03, 0x50, 0x4c, 0x54, 0x45, 0x38, 0x80, 0xff,
            0x9b, 0x83, 0xfe, 0x34, 0x00, 0x00, 0x00, 0x1f, 0x49, 0x44, 0x41,
            0x54, 0x68, 0x05, 0xed, 0xc1, 0x01, 0x0d, 0x00, 0x00, 0x00, 0xc2,
            0x20, 0xfb, 0xa7, 0x7e, 0x0e, 0x37, 0x60, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0xe7, 0x02, 0x21, 0x00, 0x00, 0x01, 0xaa,
            0x51, 0xba, 0x94, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
            0xae, 0x42, 0x60, 0x82,
          ]),
        );
        const { src } = await im.resolveSourceImage(
          Platform.ANDROID,
          ResourceType.ICON,
          ['foo.png', 'bar.png'],
          null,
        );
        expect(src).toEqual('bar.png');
        expect(fsMock.readFile).toHaveBeenCalledTimes(2);
        expect(resourcesMock.validateResource).toHaveBeenCalledTimes(1);
      });
    });
  });
});
