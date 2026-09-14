#!/usr/bin/env node
/**
 * scripts/generate-icons.js
 *
 * Generates all required PNG icons from a single SVG source using Sharp.
 * Run: node scripts/generate-icons.js
 *
 * Install dependency first: npm install --save-dev sharp
 */

const sharp  = require("sharp");
const path   = require("path");
const fs     = require("fs");

const SIZES = [16, 32, 48, 96, 128];
const OUT_DIR = path.resolve(__dirname, "..", "icons");
const SVG_PATH = path.resolve(__dirname, "..", "icons", "icon.svg");

if (!fs.existsSync(SVG_PATH)) {
  console.error("❌ icons/icon.svg not found. Create it first.");
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const svgBuffer = fs.readFileSync(SVG_PATH);

  for (const size of SIZES) {
    // Coloured version
    const outPath = path.join(OUT_DIR, `icon${size}.png`);
    await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
    console.log(`✅ ${outPath}`);

    // Greyscale version (used when not on gemini.google.com)
    const grayPath = path.join(OUT_DIR, `icon${size}_gray.png`);
    await sharp(svgBuffer).resize(size, size).grayscale().png().toFile(grayPath);
    console.log(`✅ ${grayPath}`);
  }

  console.log("\n🎉 All icons generated.");
})();
