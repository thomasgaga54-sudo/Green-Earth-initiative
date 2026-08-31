/**
 * disable-physical-rewards.js
 *
 * One-time script: marks the Tote Bag and Tree Planting Certificate
 * as unavailable in the live MongoDB Atlas database so they no longer
 * appear in the rewards catalogue for users.
 *
 * Usage (run from backend/ directory):
 *   node src/disable-physical-rewards.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { Reward } = require("./models/user.model");

const DISABLE = [
  "Green Earth Eco Tote Bag",
  "Tree Planting Certificate",
  "Green Earth Premium Bundle",  // physical merchandise
];

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB\n");

  for (const title of DISABLE) {
    const result = await Reward.updateOne(
      { title },
      { $set: { available: false } }
    );
    if (result.matchedCount === 0) {
      console.warn(`⚠️  Not found in DB: "${title}"`);
    } else if (result.modifiedCount > 0) {
      console.log(`✅ Disabled: "${title}"`);
    } else {
      console.log(`ℹ️  Already disabled: "${title}"`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone.");
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
