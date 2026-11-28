// Minimal Jest setup for jest-expo (SDK 51). Part of CT0 (client test setup).
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFiles: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/ios/", "/android/"],
  // K-1 (CI test timeout, #33): the first test in a file loads its screen's
  // modules on a cold, busy CI runner, which can pass Jest's default 5 s.
  // Locally these tests take well under a second; a real hang still fails.
  testTimeout: 20000,
};
