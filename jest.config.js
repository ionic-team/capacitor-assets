module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/test/**/*.(ts|tsx|js|mjs)'],
  testPathIgnorePatterns: ['/test/fixtures/'],
  globals: {
    'ts-jest': {
      diagnostics: {
        // warnOnly: true,
      },
      tsConfig: {
        types: ['node', 'jest'],
      },
    },
  },
};
