const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const { User, Task, Submission } = require("../models/user.model");
const { protect, adminOnly } = require("../middleware/auth.middleware");
const { fraudCheck, trackRegistrationIP } = require("../middleware/fraud.middleware");

// Auth
router.post("/register", trackRegistrationIP, register);
router.post("/login", login);

// Public
router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find({}, "name points level").sort({ points: -1 }).limit(10);
    res.json(users);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// User: submit task
router.post("/submit", protect, fraudCheck, async (req, res) => {
  try {
    const { taskId, imageUrl, note } = req.body;
    const userId = req.user.id;
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    if (!imageUrl) return res.status(400).json({ msg: "Please upload a photo as proof." });

    const fraudFlags = req.fraudFlags || [];
    // Auto-flag status if fraud signals detected
    const status = fraudFlags.length > 0 ? "flagged" : "pending";

    const submission = await Submission.create({
      userId, taskId, imageUrl, note,
      fraudFlags,
      submissionIp: ip,
      status
    });
    res.json({ submission, flagged: fraudFlags.length > 0 });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// User: get own submissions
router.get("/my-submissions", protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user.id }).populate("taskId");
    res.json(submissions);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// ── Admin routes ────────────────────────────────────────────

// Get all users
router.get("/admin/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Create task
router.post("/admin/tasks", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, points } = req.body;
    const task = await Task.create({ title, description, points });
    res.json(task);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Delete task
router.delete("/admin/tasks/:id", protect, adminOnly, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: "Task deleted" });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Get all submissions (pending + flagged)
router.get("/admin/submissions", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query; // ?status=flagged | pending | approved | rejected
    const filter = status ? { status } : {};
    const submissions = await Submission.find(filter)
      .populate("userId", "name email flaggedForReview flagReason registrationIp")
      .populate("taskId", "title points")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Approve submission → award points
router.patch("/admin/submissions/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id).populate("taskId");
    if (!sub) return res.status(404).json({ msg: "Submission not found" });
    if (sub.status === "approved") return res.status(400).json({ msg: "Already approved" });
    sub.status = "approved";
    await sub.save();
    if (sub.taskId) {
      await User.findByIdAndUpdate(sub.userId, { $inc: { points: sub.taskId.points } });
    }
    res.json({ msg: "Approved", submission: sub });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Reject submission
router.patch("/admin/submissions/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const sub = await Submission.findByIdAndUpdate(
      req.params.id, { status: "rejected" }, { new: true }
    );
    res.json({ msg: "Rejected", submission: sub });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Unflag a user (clear fraud flag)
router.patch("/admin/users/:id/unflag", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { flaggedForReview: false, flagReason: null },
      { new: true }
    );
    res.json({ msg: "User unflagged", user });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Ban a user (sets flaggedForReview + adds ban flag)
router.patch("/admin/users/:id/ban", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { flaggedForReview: true, flagReason: "banned_by_admin" },
      { new: true }
    );
    res.json({ msg: "User banned", user });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
