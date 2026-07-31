const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { User, Task } = require("./models/user.model");

const ADMIN_EMAIL = "admin@greenearth.com";
const ADMIN_PASSWORD = "GreenAdmin@2024";

const SEED_TASKS = [
  { title: "Plant a Tree", description: "Plant a tree in your neighborhood and submit proof.", points: 50 },
  { title: "Plastic-Free Day", description: "Go an entire day without using single-use plastic.", points: 30 },
  { title: "Bike to Work", description: "Use a bicycle instead of a car for your commute.", points: 25 },
  { title: "Community Clean-Up", description: "Participate in a local clean-up event.", points: 40 },
  { title: "Reduce Energy Use", description: "Turn off all non-essential appliances for 24 hours.", points: 20 },
  { title: "Compost Waste", description: "Set up a compost bin and submit a photo.", points: 35 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URL);
  console.log("Connected to MongoDB");

  // Create admin
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (!existing) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({ name: "Admin", email: ADMIN_EMAIL, password: hashed, isAdmin: true });
    console.log("✅ Admin user created");
    console.log("   Email:   ", ADMIN_EMAIL);
    console.log("   Password:", ADMIN_PASSWORD);
  } else {
    // Make sure existing admin has isAdmin flag
    await User.findOneAndUpdate({ email: ADMIN_EMAIL }, { isAdmin: true });
    console.log("✅ Admin already exists, ensured isAdmin=true");
  }

  // Seed tasks if none exist
  const taskCount = await Task.countDocuments();
  if (taskCount === 0) {
    await Task.insertMany(SEED_TASKS);
    console.log(`✅ Seeded ${SEED_TASKS.length} tasks`);
  } else {
    console.log(`ℹ️  Tasks already exist (${taskCount}), skipping task seed`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch(err => { console.error(err); process.exit(1); });
