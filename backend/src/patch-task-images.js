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
  { title: "Create a Compost Pile",                file: path.join(__dirname, "../uploads/compostbin.jpg"),    mime: "image/jpeg" },
  { title: "Report Illegal Dumping",               file: path.join(__dirname, "../uploads/report.jpg"),        mime: "image/jpeg" },
  { title: "Community Clean-Up",                   file: path.join(__dirname, "../uploads/communityclean.jpg"),mime: "image/jpeg" },
  { title: "Bike to Work",                         file: path.join(__dirname, "../uploads/Biketowork.jpg"),    mime: "image/jpeg" },
  { title: "Reduce Energy Use",                    file: path.join(__dirname, "../uploads/turnoff.jpg"),     mime: "image/jpeg" },
  { title: "Compost Waste",                        file: path.join(__dirname, "../uploads/setbin.jpg"),      mime: "image/jpeg" },

  // ── New image patches ──────────────────────────────────
  { title: "Clean the Kitchen",                          file: path.join(__dirname, "../uploads/cleankit.jpg"),          mime: "image/jpeg" },
  { title: "Clean the Bathroom",                         file: path.join(__dirname, "../uploads/cleantoilet.jpg"),       mime: "image/jpeg" },
  { title: "Clean Windows",                              file: path.join(__dirname, "../uploads/cleanwin.jpg"),          mime: "image/jpeg" },
  { title: "Collect 25 Plastic Bottles",                 file: path.join(__dirname, "../uploads/collectplastic.jpg"),   mime: "image/jpeg" },
  { title: "Donate Usable Items Instead of Throwing Away", file: path.join(__dirname, "../uploads/donate.jpg"),         mime: "image/jpeg" },
  { title: "Drink Water Instead of a Sugary Drink",      file: path.join(__dirname, "../uploads/drinkwater (1).jpg"),   mime: "image/jpeg" },
  { title: "Fold and Arrange Clothes",                   file: path.join(__dirname, "../uploads/foldcloth.jpg"),        mime: "image/jpeg" },
  { title: "Help an Elderly Family Member with Chores",  file: path.join(__dirname, "../uploads/helpold.jpg"),          mime: "image/jpeg" },
  { title: "Clean Household Appliances",                 file: path.join(__dirname, "../uploads/household.jpg"),        mime: "image/jpeg" },
  { title: "Make Your Bed",                              file: path.join(__dirname, "../uploads/makebed.jpg"),          mime: "image/jpeg" },
  { title: "Mop the Floor",                              file: path.join(__dirname, "../uploads/mopfloor.jpg"),         mime: "image/jpeg" },
  { title: "Collect 10 Plastic Bottles",                 file: path.join(__dirname, "../uploads/picklitter.jpg"),       mime: "image/jpeg" },
  { title: "Help Prepare a Meal",                        file: path.join(__dirname, "../uploads/preparemeal.jpg"),      mime: "image/jpeg" },
  { title: "Repair or Report a Leaking Tap",             file: path.join(__dirname, "../uploads/repairtap.jpg"),        mime: "image/jpeg" },
  { title: "Reuse a Container",                          file: path.join(__dirname, "../uploads/reuse.jpg"),            mime: "image/jpeg" },
  { title: "Reuse Suitable Household Water",             file: path.join(__dirname, "../uploads/reusewater.jpg"),       mime: "image/jpeg" },
  { title: "Take Out the Rubbish",                       file: path.join(__dirname, "../uploads/rubbish.jpg"),          mime: "image/jpeg" },
  { title: "Separate Plastic from Other Waste",          file: path.join(__dirname, "../uploads/separateplastic.jpg"),  mime: "image/jpeg" },
  { title: "Sweep the House",                            file: path.join(__dirname, "../uploads/sweepfloor.jpg"),       mime: "image/jpeg" },
  { title: "Turn Off Unnecessary Lights",                file: path.join(__dirname, "../uploads/Unnecessary Lights.jpg"), mime: "image/jpeg" },
  { title: "Unplug Unused Appliances",                   file: path.join(__dirname, "../uploads/unplung.jpg"),          mime: "image/jpeg" },
  { title: "Wash the Car",                               file: path.join(__dirname, "../uploads/washcar.jpg"),          mime: "image/jpeg" },
  { title: "Clean Your Study/Work Area",                 file: path.join(__dirname, "../uploads/workarea.jpg"),         mime: "image/jpeg" },
  { title: "Turn Off TV When Not Being Used",            file: path.join(__dirname, "../uploads/turnoff.jpg"),          mime: "image/jpeg" },
  { title: "Wash Dishes",                                file: path.join(__dirname, "../uploads/washdish.jpg"),         mime: "image/jpeg" },
  { title: "Water a Plant",                              file: path.join(__dirname, "../uploads/waterplant.jpg"),       mime: "image/jpeg" },
  { title: "Turn Off Tap While Brushing",                file: path.join(__dirname, "../uploads/brush.jpg"),            mime: "image/jpeg" },
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
