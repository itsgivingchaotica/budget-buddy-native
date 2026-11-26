// Minimal Jest setup for jest-expo (SDK 51). Part of CT0 (client test setup).
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFiles: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/ios/", "/android/"],
};
