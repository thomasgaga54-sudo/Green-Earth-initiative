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
  {
    title: "Create a Small Home Garden",
    file: path.join(__dirname, "../uploads/homegarden.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Fetch Water for Household Use",
    file: path.join(__dirname, "../uploads/water.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Remove Weeds Around a Plant",
    file: path.join(__dirname, "../uploads/removeweed.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Pick Up Litter Around Your Compound",
    file: path.join(__dirname, "../uploads/pict.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Clean a Drainage Area Safely",
    file: path.join(__dirname, "../uploads/Drainage.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Clean the Compound",
    file: path.join(__dirname, "../uploads/compound.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Organise Your Wardrobe",
    file: path.join(__dirname, "../uploads/wardrope.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Clean the Bathroom",
    file: path.join(__dirname, "../uploads/bathroom.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Wash Clothes",
    file: path.join(__dirname, "../uploads/wash.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Wash Dishes",
    file: path.join(__dirname, "../uploads/washdish.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Close Taps Properly After Use",
    file: path.join(__dirname, "../uploads/tap.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Take a Shorter Shower",
    file: path.join(__dirname, "../uploads/shower.jpg"),
    mime: "image/jpeg",
  },
  {
    title: "Check Appliances Are Off Before Leaving",
    file: path.join(__dirname, "../uploads/off.jpg"),
    mime: "image/jpeg",
  },
  { title: "Go Car-Free for One Month",            file: path.join(__dirname, "../uploads/carfree.jpg"),     mime: "image/jpeg" },
  { title: "Draw a Save the Earth Poster",         file: path.join(__dirname, "../uploads/draw.jpg"),        mime: "image/jpeg" },
  { title: "Plant and Harvest a Vegetable Garden", file: path.join(__dirname, "../uploads/grow.jpg"),        mime: "image/jpeg" },
  { title: "Pick Up 10 Pieces of Litter",          file: path.join(__dirname, "../uploads/pick.jpg"),        mime: "image/jpeg" },
  { title: "Learn 5 Recycling Facts",              file: path.join(__dirname, "../uploads/recycle.jpg"),     mime: "image/jpeg" },
  { title: "Complete a 5km Plogging Run",          file: path.join(__dirname, "../uploads/runpick.jpg"),     mime: "image/jpeg" },
  { title: "Plant Seeds in a Cup",                 file: path.join(__dirname, "../uploads/seed.jpg"),        mime: "image/jpeg" },
  { title: "Teach a Friend About Recycling",       file: path.join(__dirname, "../uploads/teachfriend.jpg"), mime: "image/jpeg" },
  { title: "Water a Plant Every Day for a Week",   file: path.join(__dirname, "../uploads/waterplant.jpg"),  mime: "image/jpeg" },
  { title: "Plant a Tree",                         file: path.join(__dirname, "../uploads/planttree1.jpg"),  mime: "image/jpeg" },
  { title: "Plastic-Free Day",                     file: path.join(__dirname, "../uploads/plasticbag.jpg"),  mime: "image/jpeg" },
  { title: "Create a Compost Pile",                file: path.join(__dirname, "../uploads/createbin.jpg"),   mime: "image/jpeg" },
  { title: "Report Illegal Dumping",               file: path.join(__dirname, "../uploads/report.jpg"),      mime: "image/jpeg" },
  { title: "Community Clean-Up",                   file: path.join(__dirname, "../uploads/comunityclean.jpg"),mime: "image/jpeg" },
  { title: "Bike to Work",                         file: path.join(__dirname, "../uploads/biketowork.jpg"),  mime: "image/jpeg" },
  { title: "Reduce Energy Use",                    file: path.join(__dirname, "../uploads/turnoff.jpg"),     mime: "image/jpeg" },
  { title: "Compost Waste",                        file: path.join(__dirname, "../uploads/setbin.jpg"),      mime: "image/jpeg" },
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
