/**
 * replace-rewards.js
 *
 * Replaces ALL existing rewards in the live DB with the new
 * PayPal cash tiers (100pts=$1, 200pts=$2, ... 5000pts=$50).
 *
 * Usage (from backend/ directory):
 *   node src/replace-rewards.js
 *
 * Safe to re-run — deletes all rewards first, then inserts fresh.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { Reward } = require("./models/user.model");

const PAYPAL_IMAGE = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop";

const NEW_REWARDS = [
  {
    title: "$1 PayPal Cash",
    description: "Redeem 100 points for a $1 PayPal cash payment sent directly to your PayPal account. Available worldwide.",
    pointsCost: 100, category: "paypal", currency: "USD", region: "Global", flag: "💵",
    imageUrl: PAYPAL_IMAGE, stock: -1, available: true,
  },
  {
    title: "$2 PayPal Cash",
    description: "Redeem 200 points for a $2 PayPal cash payment sent directly to your PayPal account. Available worldwide.",
    pointsCost: 200, category: "paypal", currency: "USD", region: "Global", flag: "💵",
    imageUrl: PAYPAL_IMAGE, stock: -1, available: true,
  },
  {
    title: "$5 PayPal Cash",
    description: "Redeem 500 points for a $5 PayPal cash payment sent directly to your PayPal account. Available worldwide.",
    pointsCost: 500, category: "paypal", currency: "USD", region: "Global", flag: "💵",
    imageUrl: PAYPAL_IMAGE, stock: -1, available: true,
  },
  {
    title: "$10 PayPal Cash",
    description: "Redeem 1,000 points for a $10 PayPal cash payment sent directly to your PayPal account. Available worldwide.",
    pointsCost: 1000, category: "paypal", currency: "USD", region: "Global", flag: "💵",
    imageUrl: PAYPAL_IMAGE, stock: -1, available: true,
  },
  {
    title: "$20 PayPal Cash",
    description: "Redeem 2,000 points for a $20 PayPal cash payment sent directly to your PayPal account. Available worldwide.",
    pointsCost: 2000, category: "paypal", currency: "USD", region: "Global", flag: "💵",
    imageUrl: PAYPAL_IMAGE, stock: -1, available: true,
  },
  {
    title: "$50 PayPal Cash",
    description: "Redeem 5,000 points for a $50 PayPal cash payment sent directly to your PayPal account. Available worldwide.",
    pointsCost: 5000, category: "paypal", currency: "USD", region: "Global", flag: "💵",
    imageUrl: PAYPAL_IMAGE, stock: -1, available: true,
  },
];

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB\n");

  const deleted = await Reward.deleteMany({});
  console.log(`🗑️  Deleted ${deleted.deletedCount} old reward(s)`);

  await Reward.insertMany(NEW_REWARDS);
  console.log(`✅ Inserted ${NEW_REWARDS.length} PayPal cash reward tiers:\n`);
  NEW_REWARDS.forEach(r => console.log(`   💵 ${r.title.padEnd(16)} — ${r.pointsCost} pts`));

  await mongoose.disconnect();
  console.log("\nDone.");
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
