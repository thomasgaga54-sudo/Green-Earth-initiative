const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { User, Task } = require("./models/user.model");

const ADMIN_EMAIL = "admin@greenearth.com";
const ADMIN_PASSWORD = "GreenAdmin@2024";

const SEED_TASKS = [
  {
    title: "Plant a Tree",
    description: "Plant a tree in your neighborhood or local park and submit a photo of you with the planted tree.",
    points: 50,
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"
  },
  {
    title: "Plastic-Free Day",
    description: "Go an entire day without using single-use plastic. Document your plastic-free choices.",
    points: 30,
    imageUrl: "https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?w=600&auto=format&fit=crop"
  },
  {
    title: "Bike to Work",
    description: "Use a bicycle instead of a car for your commute. Submit a photo of your bike at your destination.",
    points: 25,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop"
  },
  {
    title: "Community Clean-Up",
    description: "Participate in or organise a local clean-up event. Submit a before and after photo.",
    points: 40,
    imageUrl: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop"
  },
  {
    title: "Reduce Energy Use",
    description: "Turn off all non-essential appliances for 24 hours and document the steps you took.",
    points: 20,
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop"
  },
  {
    title: "Compost Waste",
    description: "Set up a compost bin at home and submit a photo of your compost setup.",
    points: 35,
    imageUrl: "https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=600&auto=format&fit=crop"
  },

  // ── Harder tasks ──────────────────────────────────────────
  {
    title: "Install a Rainwater Harvesting System",
    description: "Build or install a rainwater collection system at your home. Submit photos of the setup and explain how you plan to use the water.",
    points: 120,
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop"
  },
  {
    title: "Switch to Solar Energy",
    description: "Install solar panels or a solar-powered device at your home or workplace. Submit a photo and your energy bill comparison before and after.",
    points: 200,
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop"
  },
  {
    title: "Run a 30-Day Zero Waste Challenge",
    description: "Commit to producing zero landfill waste for 30 days. Keep a daily log, take weekly photos of your rubbish, and submit a final summary report.",
    points: 150,
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop"
  },
  {
    title: "Organise a School or Workplace Eco Workshop",
    description: "Plan and run an environmental awareness workshop for at least 10 people. Submit your workshop materials, attendance list, and photos from the event.",
    points: 180,
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop"
  },
  {
    title: "Create a Wildlife Garden",
    description: "Transform part of your garden into a wildlife-friendly habitat with native plants, a bird feeder, or an insect hotel. Submit before/after photos and a description of species attracted.",
    points: 100,
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop"
  },
  {
    title: "Complete a 5km Plogging Run",
    description: "Plogging is jogging while picking up litter. Run at least 5km collecting rubbish along the way. Submit your route map, a photo of the waste collected, and your run time.",
    points: 75,
    imageUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&auto=format&fit=crop"
  },
  {
    title: "Go Car-Free for One Month",
    description: "Commit to using only public transport, cycling, or walking for an entire month. Submit a weekly travel log with photos and a final reflection on your carbon savings.",
    points: 250,
    imageUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop"
  },
  {
    title: "Plant and Harvest a Vegetable Garden",
    description: "Grow your own vegetables from seed to harvest. Document the full journey with photos from planting, growing, and harvesting stages over at least 6 weeks.",
    points: 130,
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop"
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URL);
  console.log("Connected to MongoDB");

  // Create or update admin
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (!existing) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({ name: "Admin", email: ADMIN_EMAIL, password: hashed, isAdmin: true });
    console.log("✅ Admin user created");
    console.log("   Email:   ", ADMIN_EMAIL);
    console.log("   Password:", ADMIN_PASSWORD);
  } else {
    await User.findOneAndUpdate({ email: ADMIN_EMAIL }, { isAdmin: true });
    console.log("✅ Admin already exists, ensured isAdmin=true");
  }

  // Clear and re-seed tasks to pick up image updates
  await Task.deleteMany({});
  await Task.insertMany(SEED_TASKS);
  console.log(`✅ Seeded ${SEED_TASKS.length} tasks with images`);

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch(err => { console.error(err); process.exit(1); });
