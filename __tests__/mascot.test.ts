import fs from "fs";
import path from "path";
import { MASCOT_SVG } from "@/components/brand/mascotSvg";

// The mascot markup used in the app must match the brand asset file.
test("mascotSvg.ts matches assets/brand/mascot.svg", () => {
  expect(MASCOT_SVG).toBe(fs.readFileSync(path.join(__dirname, "..", "assets", "brand", "mascot.svg"), "utf8"));
});
