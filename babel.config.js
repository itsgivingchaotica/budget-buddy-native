// UP1 (Expo upgrade): NativeWind 4 setup (was the NativeWind 2 Babel plugin).
// unstable_transformImportMeta: since SDK 53, Metro resolves packages through
// their "exports", which picks Zustand's ESM build; it uses import.meta, which
// Hermes doesn't support, so babel-preset-expo polyfills it.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind", unstable_transformImportMeta: true }],
      "nativewind/babel",
    ],
  };
};
