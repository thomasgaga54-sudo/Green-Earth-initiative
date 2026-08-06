const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  isAdmin: { type: Boolean, default: false },
  registrationIp: String,
  flaggedForReview: { type: Boolean, default: false },
  flagReason: String,
  createdAt: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  points: Number,
  imageUrl: String,
  category: { type: String, default: "general" }, // general | children | hard
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
  createdAt: { type: Date, default: Date.now }
});

const RewardSchema = new mongoose.Schema({
  title: String,
  description: String,
  pointsCost: Number,
  imageUrl: String,
  category: { type: String, default: "voucher" }, // voucher | merchandise | digital
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

const User = mongoose.model("User", UserSchema);
const Task = mongoose.model("Task", TaskSchema);
const Submission = mongoose.model("Submission", SubmissionSchema);
const Reward = mongoose.model("Reward", RewardSchema);
const Redemption = mongoose.model("Redemption", RedemptionSchema);

module.exports = { User, Task, Submission, Reward, Redemption };
