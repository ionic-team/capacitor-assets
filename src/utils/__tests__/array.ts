import { combinationJoiner, indexCombinatoryIterator } from '../array';

describe('cordova-res', () => {
  describe('utils/array', () => {
    describe('combinationJoiner', () => {
      it('should rock', () => {
        expect(
          combinationJoiner([['a', 'd'], ['c']], t =>
            t.join('/').toUpperCase(),
          ),
        ).toEqual(['A/C', 'D/C']);
      });

      it('should combine', () => {
        expect(
          combinationJoiner(
            [
              ['a', 'b', 'c'],
              ['x', 'y', 'z'],
            ],
            t => t.join(''),
          ),
        ).toEqual(['ax', 'ay', 'az', 'bx', 'by', 'bz', 'cx', 'cy', 'cz']);
      });
    });

    describe('indexCombinatoryIterator', () => {
      it('should not iterate for no input', () => {
        const result = [...indexCombinatoryIterator([])];
        expect(result).toEqual([]);
      });

      it('should not iterate if empty array present', () => {
        const result = [...indexCombinatoryIterator([[1, 2, 3], []])];
        expect(result).toEqual([]);
      });

      it('should iterate once for product of 1', () => {
        const result = [...indexCombinatoryIterator([[1], [2], [3]])];
        expect(result).toEqual([[0, 0, 0]]);
      });

      it('should iterate array indexes for product of 4', () => {
        const result = [
          ...indexCombinatoryIterator([
            [1, 2],
            [3, 4],
          ]),
        ];
        expect(result).toEqual([
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ]);
      });

      it('should iterate array indexes for product of 9', () => {
        const result = [
          ...indexCombinatoryIterator([
            [1, 2, 3],
            [4, 5, 6],
          ]),
        ];
        expect(result).toEqual([
          [0, 0],
          [0, 1],
          [0, 2],
          [1, 0],
          [1, 1],
          [1, 2],
          [2, 0],
          [2, 1],
          [2, 2],
        ]);
      });

      it('should iterate array indexes for oblong input', () => {
        const result = [...indexCombinatoryIterator([[1, 2], [3, 4], [5]])];
        expect(result).toEqual([
          [0, 0, 0],
          [0, 1, 0],
          [1, 0, 0],
          [1, 1, 0],
        ]);
      });
    });
  });
});
