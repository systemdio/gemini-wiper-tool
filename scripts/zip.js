#!/usr/bin/env node
/**
 * scripts/zip.js
 *
 * Packages the extension into a distributable .zip file (required for AMO submission).
 * Run: node scripts/zip.js   (or: npm run zip)
 */

const archiver = require("archiver");
const fs       = require("fs");
const path     = require("path");

const ROOT     = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const { name, version } = require(path.join(ROOT, "package.json"));
const OUT_FILE = path.join(DIST_DIR, `${name}-${version}.zip`);

// Files and directories to include
const INCLUDE = [
  "manifest.json",
  "background/**",
  "content/**",
  "popup/**",
  "icons/*.png",
  "icons/Gemini Looping.gif",
];

// Files and patterns to exclude
const EXCLUDE = [
  "icons/icon.svg",
  "**/*.map",
  "node_modules/**",
  "dist/**",
  "scripts/**",
  ".git/**",
];

fs.mkdirSync(DIST_DIR, { recursive: true });

const output  = fs.createWriteStream(OUT_FILE);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  const kb = (archive.pointer() / 1024).toFixed(1);
  console.log(`✅ Packaged → ${OUT_FILE} (${kb} KB)`);
});

archive.on("error", (err) => { throw err; });
archive.pipe(output);

for (const pattern of INCLUDE) {
  const full = path.join(ROOT, pattern);
  if (pattern.endsWith("/**")) {
    const dir = pattern.slice(0, -3);
    archive.directory(path.join(ROOT, dir), dir, (entry) => {
      if (EXCLUDE.some((ex) => new RegExp(ex.replace("**", ".*")).test(entry.name))) return false;
      return entry;
    });
  } else if (pattern.includes("*")) {
    const dir  = path.dirname(pattern);
    const glob = path.basename(pattern);
    archive.glob(glob, { cwd: path.join(ROOT, dir) }, { prefix: dir });
  } else {
    if (fs.existsSync(full)) {
      archive.file(full, { name: pattern });
    }
  }
}

archive.finalize();
