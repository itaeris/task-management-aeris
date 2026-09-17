const { spawnSync } = require("node:child_process");
const { join } = require("node:path");

const root = join(__dirname, "../..");
const tsc = require.resolve("typescript/bin/tsc", { paths: [root, __dirname] });
const extra = process.argv.slice(2);
const result = spawnSync(process.execPath, [tsc, "-p", "tsconfig.build.json", ...extra], {
  stdio: "inherit",
  cwd: __dirname,
});
process.exit(result.status ?? 1);
