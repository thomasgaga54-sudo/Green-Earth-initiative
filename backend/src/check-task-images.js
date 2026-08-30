/**
 * check-task-images.js
 * Prints every task title and its current imageUrl type so we can see
 * which ones are broken (/uploads/... paths), which are Unsplash, and
 * which are base64.
 *
 * Usage: node src/check-task-images.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { Task } = require("./models/user.model");

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URL);

  const tasks = await Task.find({}, "title imageUrl").sort({ title: 1 });

  let base64Count = 0, unsplashCount = 0, uploadsCount = 0, noneCount = 0, otherCount = 0;

  console.log("\n── Task Image Report ──────────────────────────────────────────");
  for (const t of tasks) {
    const url = t.imageUrl || "";
    let type;
    if (!url)                           { type = "❌ NONE";     noneCount++; }
    else if (url.startsWith("data:"))   { type = "✅ base64";   base64Count++; }
    else if (url.includes("unsplash"))  { type = "🌐 Unsplash"; unsplashCount++; }
    else if (url.startsWith("/uploads")){ type = "⚠️  /uploads"; uploadsCount++; }
    else                                { type = "🔗 other";    otherCount++; }
    console.log(`  ${type.padEnd(14)}  ${t.title}`);
  }

  console.log("\n── Summary ────────────────────────────────────────────────────");
  console.log(`  ✅ base64   : ${base64Count}   (stored in DB — always works)`);
  console.log(`  🌐 Unsplash : ${unsplashCount}   (external URL — works while Unsplash is up)`);
  console.log(`  ⚠️  /uploads  : ${uploadsCount}   (BROKEN on Render — ephemeral filesystem)`);
  console.log(`  ❌ none     : ${noneCount}   (no image)`);
  console.log(`  🔗 other    : ${otherCount}`);
  console.log(`  Total       : ${tasks.length}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
