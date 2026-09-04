/**
 * patch-task-images.js
 *
 * Reads local image files from /uploads and updates task imageUrls
 * in MongoDB with base64 data URLs so they persist on ephemeral
 * filesystems (Render, etc.)
 *
 * Usage: node src/patch-task-images.js
 * Safe to run multiple times — only updates tasks where a local file exists.
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { Task } = require("./models/user.model");

const u = (file) => path.join(__dirname, "../uploads", file);

const PATCHES = [
  // ── Personal Healthy-Living ───────────────────────────────
  { title: "Drink Water Instead of a Sugary Drink",     file: u("drinkwater (1).jpg") },
  { title: "Clean Your Street",                         file: u("cleanstreet (1).jpg") },
  { title: "Plant Trees in a Community Space",          file: u("communitytree (1).jpg") },
  { title: "Water School Plants",                       file: u("schoolplant (1).jpg") },
  { title: "Create a Recycling Box for Your Class",     file: u("classbox.jpg") },

  // ── School Tasks ──────────────────────────────────────────
  // (school tasks use Unsplash URLs — no local files needed unless added)

  // ── Family Tasks ──────────────────────────────────────────
  { title: "Help an Elderly Family Member",             file: u("helpold.jpg") },
  { title: "Help an Elderly Family Member with Chores", file: u("helpold.jpg") },
  { title: "Cook or Help Prepare Food for the Family",  file: u("preparemeal.jpg") },

  // ── Waste Management ──────────────────────────────────────
  { title: "Separate Plastic from Other Waste",         file: u("separateplastic.jpg") },
  { title: "Collect 10 Plastic Bottles",                file: u("picklitter.jpg") },
  { title: "Collect 25 Plastic Bottles",                file: u("collectplastic.jpg") },
  { title: "Reuse a Container",                         file: u("reuse.jpg") },

  // ── Energy-Saving ─────────────────────────────────────────
  { title: "Turn Off Unnecessary Lights",               file: u("Unnecessary Lights.jpg") },
  { title: "Unplug Unused Appliances",                  file: u("unplung.jpg") },
  { title: "Turn Off TV When Not Being Used",           file: u("turnoff.jpg") },
  { title: "Check Appliances Are Off Before Leaving",   file: u("off.jpg") },
  { title: "Reduce Energy Use",                         file: u("turnoff.jpg") },

  // ── Water-Saving ──────────────────────────────────────────
  { title: "Turn Off Tap While Brushing",               file: u("brush.jpg") },
  { title: "Repair or Report a Leaking Tap",            file: u("repairtap.jpg") },
  { title: "Reuse Suitable Household Water",            file: u("reusewater.jpg") },
  { title: "Close Taps Properly After Use",             file: u("tap.jpg") },
  { title: "Take a Shorter Shower",                     file: u("shower.jpg") },
  { title: "Collect Rainwater for Plants",              file: u("rainwater.jpg") },

  // ── Domestic Chores ───────────────────────────────────────
  { title: "Sweep the House",                           file: u("sweepfloor.jpg") },
  { title: "Mop the Floor",                             file: u("mopfloor.jpg") },
  { title: "Wash Dishes",                               file: u("washdish.jpg") },
  { title: "Make Your Bed",                             file: u("makebed.jpg") },
  { title: "Wash Clothes",                              file: u("wash.jpg") },
  { title: "Fold and Arrange Clothes",                  file: u("foldcloth.jpg") },
  { title: "Clean the Kitchen",                         file: u("cleankit.jpg") },
  { title: "Clean the Bathroom",                        file: u("cleantoilet.jpg") },
  { title: "Clean Windows",                             file: u("cleanwin.jpg") },
  { title: "Take Out the Rubbish",                      file: u("rubbish.jpg") },
  { title: "Organise Your Wardrobe",                    file: u("wardrope.jpg") },
  { title: "Clean Your Study/Work Area",                file: u("workarea.jpg") },
  { title: "Wash the Car",                              file: u("washcar.jpg") },
  { title: "Clean the Compound",                        file: u("compound.jpg") },
  { title: "Help Prepare a Meal",                       file: u("preparemeal.jpg") },
  { title: "Fetch Water for Household Use",             file: u("water.jpg") },
  { title: "Clean Household Appliances",                file: u("household.jpg") },

  // ── Environmental / General ───────────────────────────────
  { title: "Water a Plant",                             file: u("waterplant.jpg") },
  { title: "Water a Plant Every Day for a Week",        file: u("waterplant.jpg") },
  { title: "Remove Weeds Around a Plant",               file: u("removeweed.jpg") },
  { title: "Create a Small Home Garden",                file: u("homegarden.jpg") },
  { title: "Pick Up Litter Around Your Compound",       file: u("pict.jpg") },
  { title: "Clean a Public Area",                       file: u("clean.avif") },
  { title: "Collect Plastic Bottles for Recycling",     file: u("bottle.jpg") },
  { title: "Reuse an Old Container",                    file: u("can.jpg") },
  { title: "Use a Reusable Shopping Bag",               file: u("bag.jpg") },
  { title: "Avoid Single-Use Plastic for a Day",        file: u("plastic.jpg") },
  { title: "Clean a Drainage Area Safely",              file: u("Drainage.jpg") },
  { title: "Report Illegal Dumping",                    file: u("report.jpg") },
  { title: "Create a Compost Pile",                     file: u("compostbin.jpg") },
  { title: "Donate Usable Items Instead of Throwing Away", file: u("donate.jpg") },

  // ── General tasks (short list) ────────────────────────────
  { title: "Plant a Tree",                              file: u("planttree1.jpg") },
  { title: "Plastic-Free Day",                          file: u("plasticbag.jpg") },
  { title: "Bike to Work",                              file: u("Biketowork.jpg") },
  { title: "Community Clean-Up",                        file: u("communityclean.jpg") },
  { title: "Compost Waste",                             file: u("setbin.jpg") },

  // ── Hard tasks ────────────────────────────────────────────
  { title: "Install a Rainwater Harvesting System",     file: u("rainwater.jpg") },
  { title: "Create a Wildlife Garden",                  file: u("garden.jpg") },
  { title: "Complete a 5km Plogging Run",               file: u("runpick.jpg") },
  { title: "Go Car-Free for One Month",                 file: u("carfree.jpg") },
  { title: "Plant and Harvest a Vegetable Garden",      file: u("grow.jpg") },

  // ── Children's tasks ──────────────────────────────────────
  { title: "Draw a Save the Earth Poster",              file: u("draw.jpg") },
  { title: "Pick Up 10 Pieces of Litter",               file: u("pick.jpg") },
  { title: "Learn 5 Recycling Facts",                   file: u("recycle.jpg") },
  { title: "Turn Off Lights When Leaving a Room",       file: u("offlight.jpg") },
  { title: "Make a Bird Feeder from Recycled Materials",file: u("bird-feeder.jpg") },
  { title: "Plant Seeds in a Cup",                      file: u("seed.jpg") },
  { title: "Have a Screen-Free Outdoor Day",            file: u("kids.jpg") },
  { title: "Teach a Friend About Recycling",            file: u("teachfriend.jpg") },

  // ── Previously missed / older titles ─────────────────────
  { title: "Pick Up 10 Pieces of Litter",               file: u("pick.jpg") },
  { title: "Teach a Friend About Recycling",            file: u("teachfriend.jpg") },
];

// Deduplicate by title (keep last entry wins — most specific)
const seen = new Map();
for (const p of PATCHES) seen.set(p.title, p.file);
const DEDUPED = [...seen.entries()].map(([title, file]) => ({ title, file }));

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB\n");

  let updated = 0;
  let alreadySet = 0;
  let missing = 0;
  let notFound = 0;

  for (const patch of DEDUPED) {
    if (!fs.existsSync(patch.file)) {
      console.warn(`⚠️  File not found: ${path.basename(patch.file)} — skipping "${patch.title}"`);
      missing++;
      continue;
    }

    // Detect mime from extension
    const ext = path.extname(patch.file).toLowerCase();
    const mime = ext === ".avif" ? "image/avif"
               : ext === ".png"  ? "image/png"
               : ext === ".webp" ? "image/webp"
               : "image/jpeg";

    const buffer = fs.readFileSync(patch.file);
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    const result = await Task.updateOne(
      { title: patch.title },
      { $set: { imageUrl: dataUrl } }
    );

    if (result.matchedCount === 0) {
      console.warn(`⚠️  Task not in DB: "${patch.title}"`);
      notFound++;
    } else if (result.modifiedCount > 0) {
      console.log(`✅  Updated: "${patch.title}"`);
      updated++;
    } else {
      console.log(`ℹ️  Already set: "${patch.title}"`);
      alreadySet++;
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Tasks updated   : ${updated}
  Already up-to-date: ${alreadySet}
  File not found  : ${missing}
  Task not in DB  : ${notFound}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
