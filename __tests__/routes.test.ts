import fs from "fs";
import path from "path";

// LG1 (new tab layout): the app's routes are exactly the four tabs, the
// Activity stack, login and Expo Router's own files. Legacy screens live in
// legacy/ and must not come back as routes.
const appDir = path.join(__dirname, "..", "app");

function routeFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(full);
    return /\.(tsx|ts)$/.test(entry.name) ? [path.relative(appDir, full)] : [];
  });
}

describe("app routes (LG1)", () => {
  // Test files must never live under app/: Expo Router would make them routes.
  it("are the four tabs, the Activity stack, login and system files (no test files)", () => {
    expect(routeFiles(appDir).sort()).toEqual(
      [
        "(tabs)/_layout.tsx",
        "(tabs)/activity/_layout.tsx",
        "(tabs)/activity/accounts.tsx",
        "(tabs)/activity/import.tsx",
        "(tabs)/activity/index.tsx",
        "(tabs)/activity/new-account.tsx",
        "(tabs)/activity/review.tsx",
        "(tabs)/activity/transfers.tsx",
        "(tabs)/coach.tsx",
        "(tabs)/index.tsx",
        "(tabs)/plan.tsx",
        "+html.tsx",
        "+not-found.tsx",
        "_layout.tsx",
        "login/_layout.tsx",
        "login/index.tsx",
      ].sort()
    );
  });

  it("keeps the legacy screens as files, outside app/", () => {
    for (const f of ["(tabs)/index.tsx", "(tabs)/explore.tsx", "new-budget.tsx", "category/index.tsx"]) {
      expect(fs.existsSync(path.join(appDir, "..", "legacy", "app", f))).toBe(true);
    }
  });
});
