const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const { User, Task, Submission, Reward, Redemption } = require("../models/user.model");
const { protect, adminOnly } = require("../middleware/auth.middleware");
const { fraudCheck, trackRegistrationIP } = require("../middleware/fraud.middleware");

// Auth
router.post("/register", trackRegistrationIP, register);
router.post("/login", login);

// Get current user profile (for point refresh)
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "-password");
    res.json(user);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Public stats endpoint
router.get("/stats", async (req, res) => {
  try {
    const [memberCount, submissionCount] = await Promise.all([
      User.countDocuments({ isAdmin: false }),
      Submission.countDocuments({ status: "approved" })
    ]);
    res.json({ members: memberCount, tasksDone: submissionCount });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

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
    // Only flag status if there are serious fraud signals (not just new account)
    const seriousFlags = fraudFlags.filter(f => f !== 'new_account_submission');
    const status = seriousFlags.length > 0 ? "flagged" : "pending";

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

// ── Rewards ─────────────────────────────────────────────────

// Get all available rewards (public)
router.get("/rewards", async (req, res) => {
  try {
    const rewards = await Reward.find({ available: true }).sort({ pointsCost: 1 });
    res.json(rewards);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Redeem a reward
router.post("/rewards/:id/redeem", protect, async (req, res) => {
  try {
    const { deliveryInfo } = req.body;
    const userId = req.user.id;
    const reward = await Reward.findById(req.params.id);
    if (!reward || !reward.available) return res.status(404).json({ msg: "Reward not available" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.points < reward.pointsCost) {
      return res.status(400).json({ msg: `Not enough points. You need ${reward.pointsCost} pts but have ${user.points} pts.` });
    }
    if (!deliveryInfo) return res.status(400).json({ msg: "Please provide your email or delivery address." });

    // Deduct points
    user.points -= reward.pointsCost;
    await user.save();

    // Reduce stock if applicable
    if (reward.stock > 0) {
      reward.stock -= 1;
      if (reward.stock === 0) reward.available = false;
      await reward.save();
    }

    const redemption = await Redemption.create({
      userId, rewardId: reward._id,
      pointsSpent: reward.pointsCost,
      deliveryInfo,
      status: "pending"
    });

    res.json({ msg: "Redemption submitted! We will process it within 14–28 business days.", redemption, remainingPoints: user.points });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Get user's redemptions
router.get("/my-redemptions", protect, async (req, res) => {
  try {
    const redemptions = await Redemption.find({ userId: req.user.id })
      .populate("rewardId", "title pointsCost imageUrl")
      .sort({ createdAt: -1 });
    res.json(redemptions);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// ── Admin Rewards ────────────────────────────────────────────

// Create a reward
router.post("/admin/rewards", protect, adminOnly, async (req, res) => {
  try {
    const reward = await Reward.create(req.body);
    res.json(reward);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Update a reward
router.patch("/admin/rewards/:id", protect, adminOnly, async (req, res) => {
  try {
    const reward = await Reward.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(reward);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Delete a reward
router.delete("/admin/rewards/:id", protect, adminOnly, async (req, res) => {
  try {
    await Reward.findByIdAndDelete(req.params.id);
    res.json({ msg: "Reward deleted" });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Get all redemptions (admin)
router.get("/admin/redemptions", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const redemptions = await Redemption.find(filter)
      .populate("userId", "name email")
      .populate("rewardId", "title pointsCost")
      .sort({ createdAt: -1 });
    res.json(redemptions);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Fulfil a redemption
router.patch("/admin/redemptions/:id/fulfil", protect, adminOnly, async (req, res) => {
  try {
    const { fulfilmentNote } = req.body;
    const redemption = await Redemption.findByIdAndUpdate(
      req.params.id,
      { status: "fulfilled", fulfilmentNote },
      { new: true }
    );
    res.json({ msg: "Redemption fulfilled", redemption });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Cancel a redemption and refund points
router.patch("/admin/redemptions/:id/cancel", protect, adminOnly, async (req, res) => {
  try {
    const redemption = await Redemption.findById(req.params.id);
    if (!redemption) return res.status(404).json({ msg: "Redemption not found" });
    if (redemption.status === "cancelled") return res.status(400).json({ msg: "Already cancelled" });
    redemption.status = "cancelled";
    await redemption.save();
    // Refund points
    await User.findByIdAndUpdate(redemption.userId, { $inc: { points: redemption.pointsSpent } });
    res.json({ msg: "Redemption cancelled and points refunded" });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
