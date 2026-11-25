#!/usr/bin/env node
// TS0 (TypeScript baseline): the app has known TypeScript errors. This check
// fails if new work adds any, in total or in any single file.
//
//   node scripts/tsc-baseline-check.js            # check against tsc-baseline.json
//   node scripts/tsc-baseline-check.js --update   # record the current errors
//
// Only lower the baseline (run --update after fixing errors), never raise it
// without the product owner's approval.
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const baselinePath = path.join(root, "tsc-baseline.json");
const tscBin = path.join(root, "node_modules", ".bin", "tsc");

const result = spawnSync(tscBin, ["--noEmit", "--pretty", "false"], { cwd: root, encoding: "utf8" });
const output = `${result.stdout || ""}${result.stderr || ""}`;
if (result.error) {
  console.error(`Could not run tsc: ${result.error.message}`);
  process.exit(2);
}

const files = {};
let total = 0;
for (const line of output.split("\n")) {
  const match = line.match(/^(.+?)\(\d+,\d+\): error TS\d+/);
  if (!match) continue;
  files[match[1]] = (files[match[1]] || 0) + 1;
  total += 1;
}

if (process.argv.includes("--update")) {
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(baselinePath, `${JSON.stringify({ total, files: sorted }, null, 2)}\n`);
  console.log(`tsc baseline updated: ${total} errors in ${Object.keys(files).length} files.`);
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const worse = Object.entries(files)
  .filter(([file, count]) => count > (baseline.files[file] || 0))
  .map(([file, count]) => `  ${file}: ${baseline.files[file] || 0} -> ${count}`);

if (worse.length > 0 || total > baseline.total) {
  console.error(`tsc baseline check FAILED: ${total} errors (baseline ${baseline.total}).`);
  if (worse.length) console.error(`Files with new errors:\n${worse.join("\n")}`);
  process.exit(1);
}

const note = total < baseline.total ? ` Fewer than the baseline (${baseline.total}); run with --update to lock in the improvement.` : "";
console.log(`tsc baseline check passed: ${total} errors (baseline ${baseline.total}).${note}`);
