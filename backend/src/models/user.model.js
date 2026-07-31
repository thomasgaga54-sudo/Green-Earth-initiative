const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  isAdmin: { type: Boolean, default: false }
});

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  points: Number,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now }
});

const SubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  imageUrl: String,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Task = mongoose.model("Task", TaskSchema);
const Submission = mongoose.model("Submission", SubmissionSchema);

module.exports = { User, Task, Submission };
