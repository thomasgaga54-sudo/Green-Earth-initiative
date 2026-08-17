/**
 * One-time script: reads local image files and updates task imageUrls in MongoDB
 * with base64 data URLs so they persist even on ephemeral filesystems (Render, etc.)
 *
 * Usage: node src/patch-task-images.js
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { Task } = require("./models/user.model");

const PATCHES = [
  {
    title: "Collect Plastic Bottles for Recycling",
    file: path.join(__dirname, "../uploads/bottle.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Clean a Public Area",
    file: path.join(__dirname, "../uploads/clean.avif"),
    mime: "image/avif",
  },
];

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  for (const patch of PATCHES) {
    if (!fs.existsSync(patch.file)) {
      console.warn(`⚠️  File not found: ${patch.file} — skipping`);
      continue;
    }
    const buffer = fs.readFileSync(patch.file);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${patch.mime};base64,${base64}`;

    const result = await Task.updateOne(
      { title: patch.title },
      { $set: { imageUrl: dataUrl } }
    );

    if (result.matchedCount === 0) {
      console.warn(`⚠️  Task not found in DB: "${patch.title}"`);
    } else if (result.modifiedCount > 0) {
      console.log(`✅ Updated image for: "${patch.title}"`);
    } else {
      console.log(`ℹ️  Already up-to-date: "${patch.title}"`);
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
