import { readFileSync, writeFileSync, chmodSync } from "node:fs";

const cliPath = "dist/cli.js";
const shebang = "#!/usr/bin/env node\n";

const contents = readFileSync(cliPath, "utf8");

if (!contents.startsWith("#!")) {
  writeFileSync(cliPath, shebang + contents);
}

chmodSync(cliPath, 0o755);

console.log("[postbuild] dist/cli.js is executable.");
