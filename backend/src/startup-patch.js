/**
 * startup-patch.js
 *
 * Called automatically on server startup (from index.js) after MongoDB connects.
 * Reads local image files from /uploads and writes them as base64 data URLs
 * into the Task collection for any task whose imageUrl is not already base64.
 *
 * Safe: uses $set only when the file exists and the current value is NOT base64.
 * This means it never overwrites an already-patched task, keeping startup fast.
 */

const path = require("path");
const fs   = require("fs");
const { Task } = require("./models/user.model");

const u = (file) => path.join(__dirname, "../uploads", file);

// Every task title → local upload file mapping
const PATCHES = [
  // Personal Healthy-Living
  { title: "Drink Water Instead of a Sugary Drink",       file: u("drinkwater (1).jpg") },
  { title: "Clean Your Street",                           file: u("cleanstreet (1).jpg") },
  { title: "Plant Trees in a Community Space",            file: u("communitytree (1).jpg") },
  { title: "Water School Plants",                         file: u("schoolplant (1).jpg") },
  { title: "Create a Recycling Box for Your Class",       file: u("classbox.jpg") },

  // Family
  { title: "Help an Elderly Family Member",               file: u("helpold.jpg") },
  { title: "Help an Elderly Family Member with Chores",   file: u("helpold.jpg") },
  { title: "Cook or Help Prepare Food for the Family",    file: u("preparemeal.jpg") },

  // Waste Management
  { title: "Separate Plastic from Other Waste",           file: u("separateplastic.jpg") },
  { title: "Collect 10 Plastic Bottles",                  file: u("picklitter.jpg") },
  { title: "Collect 25 Plastic Bottles",                  file: u("collectplastic.jpg") },
  { title: "Reuse a Container",                           file: u("reuse.jpg") },
  { title: "Donate Usable Items Instead of Throwing Away",file: u("donate.jpg") },

  // Energy
  { title: "Turn Off Unnecessary Lights",                 file: u("Unnecessary Lights.jpg") },
  { title: "Unplug Unused Appliances",                    file: u("unplung.jpg") },
  { title: "Turn Off TV When Not Being Used",             file: u("turnoff.jpg") },
  { title: "Check Appliances Are Off Before Leaving",     file: u("off.jpg") },
  { title: "Reduce Energy Use",                           file: u("turnoff.jpg") },
  { title: "Turn Off Lights When Leaving a Room",         file: u("offlight.jpg") },

  // Water
  { title: "Turn Off Tap While Brushing",                 file: u("brush.jpg") },
  { title: "Repair or Report a Leaking Tap",              file: u("repairtap.jpg") },
  { title: "Reuse Suitable Household Water",              file: u("reusewater.jpg") },
  { title: "Close Taps Properly After Use",               file: u("tap.jpg") },
  { title: "Take a Shorter Shower",                       file: u("shower.jpg") },
  { title: "Collect Rainwater for Plants",                file: u("rainwater.jpg") },
  { title: "Install a Rainwater Harvesting System",       file: u("rainwater.jpg") },

  // Domestic
  { title: "Sweep the House",                             file: u("sweepfloor.jpg") },
  { title: "Mop the Floor",                               file: u("mopfloor.jpg") },
  { title: "Wash Dishes",                                 file: u("washdish.jpg") },
  { title: "Make Your Bed",                               file: u("makebed.jpg") },
  { title: "Wash Clothes",                                file: u("wash.jpg") },
  { title: "Fold and Arrange Clothes",                    file: u("foldcloth.jpg") },
  { title: "Clean the Kitchen",                           file: u("cleankit.jpg") },
  { title: "Clean the Bathroom",                          file: u("cleantoilet.jpg") },
  { title: "Clean Windows",                               file: u("cleanwin.jpg") },
  { title: "Take Out the Rubbish",                        file: u("rubbish.jpg") },
  { title: "Organise Your Wardrobe",                      file: u("wardrope.jpg") },
  { title: "Clean Your Study/Work Area",                  file: u("workarea.jpg") },
  { title: "Wash the Car",                                file: u("washcar.jpg") },
  { title: "Clean the Compound",                          file: u("compound.jpg") },
  { title: "Help Prepare a Meal",                         file: u("preparemeal.jpg") },
  { title: "Fetch Water for Household Use",               file: u("water.jpg") },
  { title: "Clean Household Appliances",                  file: u("household.jpg") },

  // Environmental / General
  { title: "Water a Plant",                               file: u("waterplant.jpg") },
  { title: "Water a Plant Every Day for a Week",          file: u("waterplant.jpg") },
  { title: "Remove Weeds Around a Plant",                 file: u("removeweed.jpg") },
  { title: "Create a Small Home Garden",                  file: u("homegarden.jpg") },
  { title: "Pick Up Litter Around Your Compound",         file: u("pict.jpg") },
  { title: "Clean a Public Area",                         file: u("clean.avif") },
  { title: "Collect Plastic Bottles for Recycling",       file: u("bottle.jpg") },
  { title: "Reuse an Old Container",                      file: u("can.jpg") },
  { title: "Use a Reusable Shopping Bag",                 file: u("bag.jpg") },
  { title: "Avoid Single-Use Plastic for a Day",          file: u("plastic.jpg") },
  { title: "Clean a Drainage Area Safely",                file: u("Drainage.jpg") },
  { title: "Report Illegal Dumping",                      file: u("report.jpg") },
  { title: "Create a Compost Pile",                       file: u("compostbin.jpg") },

  // General (short list)
  { title: "Plant a Tree",                                file: u("planttree1.jpg") },
  { title: "Plastic-Free Day",                            file: u("plasticbag.jpg") },
  { title: "Bike to Work",                                file: u("Biketowork.jpg") },
  { title: "Community Clean-Up",                          file: u("communityclean.jpg") },
  { title: "Compost Waste",                               file: u("setbin.jpg") },

  // Hard
  { title: "Create a Wildlife Garden",                    file: u("garden.jpg") },
  { title: "Complete a 5km Plogging Run",                 file: u("runpick.jpg") },
  { title: "Go Car-Free for One Month",                   file: u("carfree.jpg") },
  { title: "Plant and Harvest a Vegetable Garden",        file: u("grow.jpg") },

  // Children
  { title: "Draw a Save the Earth Poster",                file: u("draw.jpg") },
  { title: "Pick Up 10 Pieces of Litter",                 file: u("pick.jpg") },
  { title: "Learn 5 Recycling Facts",                     file: u("recycle.jpg") },
  { title: "Make a Bird Feeder from Recycled Materials",  file: u("bird-feeder.jpg") },
  { title: "Plant Seeds in a Cup",                        file: u("seed.jpg") },
  { title: "Have a Screen-Free Outdoor Day",              file: u("kids.jpg") },
  { title: "Teach a Friend About Recycling",              file: u("teachfriend.jpg") },
];

// Deduplicate — last entry wins
const deduped = [...new Map(PATCHES.map(p => [p.title, p.file])).entries()]
  .map(([title, file]) => ({ title, file }));

module.exports = async function startupPatch() {
  let updated = 0;
  let skipped = 0;

  for (const { title, file } of deduped) {
    // Skip if the upload file isn't present on this machine
    if (!fs.existsSync(file)) continue;

    // Only patch if the current imageUrl is NOT already base64
    const task = await Task.findOne({ title }, "imageUrl");
    if (!task) continue;
    if (task.imageUrl && task.imageUrl.startsWith("data:")) { skipped++; continue; }

    const ext  = path.extname(file).toLowerCase();
    const mime = ext === ".avif" ? "image/avif"
               : ext === ".png"  ? "image/png"
               : ext === ".webp" ? "image/webp"
               : "image/jpeg";

    const dataUrl = `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
    await Task.updateOne({ title }, { $set: { imageUrl: dataUrl } });
    updated++;
  }

  if (updated > 0 || skipped > 0) {
    console.log(`🖼️  Startup image patch: ${updated} task(s) updated, ${skipped} already base64.`);
  }
};
