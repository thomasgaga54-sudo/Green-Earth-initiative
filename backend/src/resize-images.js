/**
 * Resize task images to 600x400px (landscape) using sharp.
 * Run: node src/resize-images.js
 *
 * Files to resize:
 *   uploads/bottle.jpg       → 600x400
 *   uploads/clean.avif       → 600x400
 *   uploads/homegarden.jpg   → 600x400
 *   uploads/water.jpg        → 600x400
 *   uploads/removeweed.jpg   → 600x400
 *   uploads/pict.jpg         → 600x400
 */

const sharp = require("sharp");
const path = require("path");

const uploadsDir = path.join(__dirname, "../uploads");

const FILES = [
  "bottle.jpg",
  "clean.avif",
  "homegarden.jpg",
  "water.jpg",
  "removeweed.jpg",
  "pict.jpg",
];

async function run() {
  for (const file of FILES) {
    const filePath = path.join(uploadsDir, file);
    const ext = path.extname(file).toLowerCase();
    const outPath = filePath; // overwrite in place

    try {
      let pipeline = sharp(filePath).resize(600, 400, {
        fit: "cover",         // crop to fill 600x400, keeping centre
        position: "centre",
      });

      // Re-encode as jpeg for .jpg files, keep avif as avif
      if (ext === ".jpg" || ext === ".jpeg") {
        pipeline = pipeline.jpeg({ quality: 85 });
      } else if (ext === ".avif") {
        pipeline = pipeline.avif({ quality: 60 });
      }

      await pipeline.toBuffer().then(buf => require("fs").writeFileSync(outPath, buf));
      console.log(`✅ Resized ${file} → 600×400`);
    } catch (err) {
      console.error(`❌ Failed ${file}: ${err.message}`);
    }
  }
  console.log("Done.");
}

run();
