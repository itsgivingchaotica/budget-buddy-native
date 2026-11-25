/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  // NativeWind 4 (UP1): required preset.
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
};
