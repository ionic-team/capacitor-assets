describe('cordova-res', () => {

  describe('image', () => {

    describe('resolveSourceImage', () => {

      let image: typeof import('../image');
      let fsMock: { [key: string]: jest.Mock };

      beforeEach(async () => {
        jest.resetModules();

        fsMock = {
          readFile: jest.fn(),
          writeFile: jest.fn(),
        };

        jest.mock('@ionic/utils-fs', () => fsMock);

        image = await import('../image');
      });

      it('should throw with empty array of source images', async () => {
        await expect(image.resolveSourceImage([])).rejects.toThrow('Could not find suitable source image.');
        expect(fsMock.readFile).not.toHaveBeenCalled();
      });

      it('should throw with source image with error', async () => {
        fsMock.readFile.mockImplementation(async () => { throw new Error('err'); });
        await expect(image.resolveSourceImage(['blah.png'])).rejects.toThrow('Could not find suitable source image.');
        expect(fsMock.readFile).toHaveBeenCalledTimes(1);
      });

      it('should resolve with proper image', async () => {
        fsMock.readFile.mockImplementationOnce(async () => { throw new Error('err'); });
        fsMock.readFile.mockImplementationOnce(async () => Buffer.from([]));
        const [ src, srcbuf ] = await image.resolveSourceImage(['foo.png', 'bar.png']);
        expect(src).toEqual('bar.png');
        expect(srcbuf).toEqual(expect.any(Buffer));
        expect(fsMock.readFile).toHaveBeenCalledTimes(2);
      });

    });

  });

});
