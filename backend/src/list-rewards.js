const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { Reward } = require("./models/user.model");

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URL);
  const rewards = await Reward.find({}, "title category available");
  rewards.forEach(r => {
    console.log(`[${r.available ? '✅' : '❌'}] ${r.category.padEnd(12)} | ${r.title}`);
  });
  await mongoose.disconnect();
  process.exit(0);
}
run().catch(err => { console.error(err); process.exit(1); });
