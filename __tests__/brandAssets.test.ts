import fs from "fs";
import path from "path";
import { MASCOT_SVG } from "@/components/brand/mascotSvg";
import { WELCOME_HERO_SVG } from "@/components/brand/welcomeHeroSvg";

// The SVG markup used in the app must match the brand asset files.
const asset = (name: string) => fs.readFileSync(path.join(__dirname, "..", "assets", "brand", name), "utf8");

test("mascotSvg.ts matches assets/brand/mascot.svg", () => {
  expect(MASCOT_SVG).toBe(asset("mascot.svg"));
});

test("welcomeHeroSvg.ts matches assets/brand/welcome-hero.svg", () => {
  expect(WELCOME_HERO_SVG).toBe(asset("welcome-hero.svg"));
});
