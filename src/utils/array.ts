export function flatten<T>(t: readonly T[][]): T[] {
  return [].concat(...(t as any));
}

export function combinationJoiner<T>(ary: T[][], joiner: (t: T[]) => T): T[] {
  return [...indexCombinatoryIterator(ary)]
    .map(indexes => indexes.map((index, i) => ary[i][index]))
    .map(joiner);
}

export function* indexCombinatoryIterator<T>(arys: T[][]): Generator<number[]> {
  if (arys.length === 0) {
    return;
  }

  const lengths = arys.map(ary => ary.length);
  const progressions = arys.map(() => 0);
  const product = lengths.reduce((acc, value) => acc * value, 1);

  for (let pos = 0; pos <= product - 1; pos++) {
    yield [...progressions];

    for (let i = progressions.length - 1; i >= 0; i--) {
      if (progressions[i] < lengths[i] - 1) {
        progressions[i]++;
        break;
      }

      progressions[i] = 0;
    }
  }
}
