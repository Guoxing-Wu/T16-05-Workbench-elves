// Put this file beside the application's package.json.
module.exports = {
  rootDir: __dirname,
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/src/features/character/tests/character.operations.test.ts",
  ],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2022",
          module: "CommonJS",
          moduleResolution: "Node",
          jsx: "react-jsx",
          esModuleInterop: true,
          verbatimModuleSyntax: false,
          strict: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  clearMocks: true,
  verbose: true,
};
