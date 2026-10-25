/** Optional separate config. Reuse the project's existing compatible Jest setup when possible. */
module.exports = {
  testEnvironment: 'node',
  testMatch: [
  "<rootDir>src/features/character/tests/character.age.test.ts",
  "<rootDir>src/features/character/tests/character.birthday.test.ts",
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          moduleResolution: 'Node',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  clearMocks: true,
  coverageDirectory: 'coverage/character',
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  // Add collectCoverageFrom using your ACTUAL Character implementation paths.
  // This includes relevant files that the current suite never imports.
  // Example pattern only: collectCoverageFrom: ['src/YOUR_CHARACTER_FOLDER/**/*.ts'],
};
