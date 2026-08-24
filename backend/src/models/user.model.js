const mongoose = require("mongoose");
const { getLevelFromPoints } = require("../utils/levels");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  isAdmin: { type: Boolean, default: false },
  // Extended profile
  phone: String,
  country: String,
  city: String,
  dateOfBirth: Date,
  gender: String,
  bio: String,
  avatarColor: String, // hex color for avatar background
  preferredLanguage: { type: String, default: "en" },
  // Premium / subscription
  isPremium: { type: Boolean, default: false },
  premiumUntil: Date,
  stripeCustomerId: String,
  // Streak tracking
  streakDays: { type: Number, default: 0 },
  lastSubmissionDate: Date,
  // Fraud & security
  registrationIp: String,
  flaggedForReview: { type: Boolean, default: false },
  flagReason: String,
  // Account lockout
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  lastLoginAt: Date,
  lastLoginIp: String,
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  points: Number,
  imageUrl: String,
  category: { type: String, default: "general" },
  taskType: { type: String, default: "photo" }, // "photo" | "quiz"
  proofLevel: { type: String, default: "basic" }, // "basic" | "enhanced" | "verified"
  quiz: [{
    question: String,
    options: [String], // always 4 options
    correctIndex: Number // 0-3
  }],
  passMark: { type: Number, default: 3 }, // min correct answers to pass
  createdAt: { type: Date, default: Date.now }
});

const SubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  imageUrl: String,
  note: String,
  status: { type: String, default: "pending" },
  fraudFlags: [String],
  submissionIp: String,
  reflectionAnswer: { type: String, default: "" },
  reflectionBonusPoints: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const RewardSchema = new mongoose.Schema({
  title: String,
  description: String,
  pointsCost: Number,
  priceMoney: { type: Number, default: 0 }, // price in cents for direct purchase (0 = points only)
  imageUrl: String,
  category: { type: String, default: "voucher" }, // voucher | merchandise | digital
  currency: { type: String, default: "GBP" },
  region: { type: String, default: "UK" },
  flag: { type: String, default: "🇬🇧" },
  stock: { type: Number, default: -1 }, // -1 = unlimited
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const RedemptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: "Reward" },
  pointsSpent: Number,
  status: { type: String, default: "pending" }, // pending | fulfilled | cancelled
  fulfilmentNote: String, // admin adds voucher code or tracking here
  deliveryInfo: String,   // user provides email/address
  createdAt: { type: Date, default: Date.now }
});

const StreakMilestoneSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  milestone: Number,   // e.g. 7, 30
  awardedAt: { type: Date, default: Date.now },
  points:    Number,
});
StreakMilestoneSchema.index({ userId: 1, milestone: 1 }, { unique: true });

const ChallengeProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  completedSteps: { type: [String], default: [] }, // step keys e.g. ["sweep_room", "plant_water"]
  bonusAwarded: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date
});

const User = mongoose.model("User", UserSchema);

// Auto-sync level when points change via findByIdAndUpdate
const syncLevel = async (filter) => {
  try {
    const user = await User.findOne(filter);
    if (user) {
      const correctLevel = getLevelFromPoints(user.points || 0);
      if (user.level !== correctLevel) {
        await User.updateOne(filter, { level: correctLevel });
      }
    }
  } catch {}
};

// Hook into findByIdAndUpdate to keep level in sync
UserSchema.post('findOneAndUpdate', async function () {
  await syncLevel(this.getQuery());
});
const Task = mongoose.model("Task", TaskSchema);
const Submission = mongoose.model("Submission", SubmissionSchema);
const Reward = mongoose.model("Reward", RewardSchema);
const Redemption = mongoose.model("Redemption", RedemptionSchema);
const StreakMilestone = mongoose.model("StreakMilestone", StreakMilestoneSchema);
const ChallengeProgress = mongoose.model("ChallengeProgress", ChallengeProgressSchema);

module.exports = { User, Task, Submission, Reward, Redemption, ChallengeProgress, StreakMilestone };
