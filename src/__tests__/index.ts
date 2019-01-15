import { generateRunOptions } from '../';

describe('cordova-res', () => {

  describe('index', () => {

    describe('generateRunOptions', () => {

      it('should provide defaults with no args', async () => {
        expect(generateRunOptions([])).toEqual({
          icon: { source: 'resources/icon.png' },
          splash: { source: 'resources/splash.png' },
        });
      });

      it('should override source image paths', async () => {
        expect(generateRunOptions(['--icon-source', 'foo.png', '--splash-source', 'bar.png'])).toEqual({
          icon: { source: 'foo.png' },
          splash: { source: 'bar.png' },
        });
      });

    });

  });

});
