const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { register, login } = require("../controllers/auth.controller");
const { User, Task, Submission, Reward, Redemption, ChallengeProgress, StreakMilestone } = require("../models/user.model");
const { protect, adminOnly } = require("../middleware/auth.middleware");
const { fraudCheck, trackRegistrationIP } = require("../middleware/fraud.middleware");
const { sendTaskReminder, sendApprovalEmail } = require("../services/email.service");
const { getLevelFromPoints } = require("../utils/levels");

// ── Earning caps (configurable via .env) ──────────────────
const DAILY_POINTS_CAP  = parseInt(process.env.DAILY_POINTS_CAP  || "500");
const WEEKLY_POINTS_CAP = parseInt(process.env.WEEKLY_POINTS_CAP || "1500");

// ── Streak milestones ──────────────────────────────────────
const STREAK_MILESTONES = [
  { days: 3,  label: "3-Day Green Start",       icon: "🌱", bonus: 50  },
  { days: 7,  label: "7-Day Green Streak",       icon: "🔥", bonus: 300 },
  { days: 14, label: "14-Day Eco Warrior",       icon: "🌿", bonus: 700 },
  { days: 30, label: "30-Day Earth Champion",    icon: "🌍", bonus: 2000 },
];

/**
 * Check if the user just hit a streak milestone and award bonus once.
 * Returns array of newly awarded milestones (empty if none).
 */
const checkStreakMilestones = async (userId, newStreak) => {
  const awarded = [];
  for (const m of STREAK_MILESTONES) {
    if (newStreak >= m.days) {
      try {
        // insertOne throws if duplicate (unique index) — safe idempotent guard
        await StreakMilestone.create({ userId, milestone: m.days, points: m.bonus });
        await User.findByIdAndUpdate(userId, { $inc: { points: m.bonus } });
        awarded.push(m);
      } catch {
        // already awarded — skip silently
      }
    }
  }
  return awarded;
};

// ── Redemption guards ──────────────────────────────────────
const MIN_LEVEL_TO_REDEEM    = 2;          // must be Green Helper or above
const MIN_ACCOUNT_AGE_DAYS   = 7;          // account must be at least 7 days old
const REDEMPTION_COOLDOWN_DAYS = 14;       // one redemption per 14 days

/**
 * Calculate how many points a user has earned today and this week.
 */
const getEarningTotals = async (userId) => {
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);

  const approved = await Submission.find({
    userId,
    status: "approved",
    createdAt: { $gte: startOfWeek }
  }).populate("taskId", "points");

  let daily = 0, weekly = 0;
  for (const sub of approved) {
    const pts = sub.taskId?.points || 0;
    weekly += pts;
    if (sub.createdAt >= startOfDay) daily += pts;
  }
  return { daily, weekly };
};

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

// Update user profile
router.patch("/me", protect, async (req, res) => {
  try {
    const allowed = ["name", "phone", "country", "city", "dateOfBirth", "gender", "bio", "avatarColor", "preferredLanguage"];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, select: "-password" });
    res.json(user);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Change password
router.post("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ msg: "Both current and new password are required." });
    if (newPassword.length < 6) return res.status(400).json({ msg: "New password must be at least 6 characters." });
    if (currentPassword === newPassword) return res.status(400).json({ msg: "New password must be different from your current password." });

    const user = await User.findById(req.user.id);
    const match = await require("bcrypt").compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ msg: "Current password is incorrect." });

    const hashed = await require("bcrypt").hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user.id, { password: hashed });
    res.json({ msg: "Password changed successfully." });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Delete own account
router.delete("/me", protect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ msg: "Please confirm your password to delete your account." });

    const user = await User.findById(req.user.id);
    const match = await require("bcrypt").compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Incorrect password." });

    await User.findByIdAndDelete(req.user.id);
    res.json({ msg: "Account deleted successfully." });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Public stats endpoint
router.get("/stats", async (req, res) => {
  try {
    const [memberCount, submissionCount] = await Promise.all([
      User.countDocuments(),
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

// User: submit quiz answers → auto-grade, award points immediately
router.post("/quiz-submit", protect, async (req, res) => {
  try {
    const { taskId, answers } = req.body; // answers: [0,2,1,3,0] — index per question
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ msg: "Task not found" });
    if (task.taskType !== "quiz") return res.status(400).json({ msg: "Not a quiz task" });

    // Check for duplicate approved quiz submission
    const { Submission } = require("../models/user.model");
    const existing = await Submission.findOne({ userId: req.user.id, taskId, status: "approved" });
    if (existing) return res.status(400).json({ msg: "You have already completed this quiz." });

    // Grade answers
    const results = task.quiz.map((q, i) => ({
      correct: answers[i] === q.correctIndex,
      correctIndex: q.correctIndex,
      yourAnswer: answers[i]
    }));
    const score = results.filter(r => r.correct).length;
    const passed = score >= (task.passMark || 3);

    // Create submission record
    const submission = await Submission.create({
      userId: req.user.id,
      taskId,
      imageUrl: "",
      note: `Quiz score: ${score}/${task.quiz.length}`,
      status: passed ? "approved" : "rejected",
      fraudFlags: [],
      submissionIp: req.ip || "unknown"
    });

    // Award points immediately if passed
    if (passed) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { points: task.points } });
      // Mark eco_quiz step in 7-day challenge
      const stepKey = getStepKey(task);
      if (stepKey) {
        await ChallengeProgress.findOneAndUpdate(
          { userId: req.user.id },
          { $addToSet: { completedSteps: stepKey } },
          { upsert: true, new: true }
        );
      }
    }

    res.json({ passed, score, total: task.quiz.length, pointsAwarded: passed ? task.points : 0, results });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Get user's streak info + milestone progress
router.get("/streak", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "streakDays lastSubmissionDate points");
    const awarded = await StreakMilestone.find({ userId: req.user.id }).select("milestone points awardedAt");
    const awardedDays = awarded.map(a => a.milestone);

    const milestones = STREAK_MILESTONES.map(m => ({
      ...m,
      achieved: (user.streakDays || 0) >= m.days,
      claimed:  awardedDays.includes(m.days),
    }));

    res.json({
      streakDays: user.streakDays || 0,
      lastSubmissionDate: user.lastSubmissionDate,
      milestones,
      awardedMilestones: awarded,
    });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Get today's daily challenge (deterministic by date — same task all day for everyone)
router.get("/daily-challenge", async (req, res) => {
  try {
    const tasks = await Task.find({ taskType: { $ne: "quiz" } });
    if (!tasks.length) return res.status(404).json({ msg: "No tasks available" });
    // Pick task based on day-of-year so it rotates daily and is consistent for all users
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const task = tasks[dayOfYear % tasks.length];
    res.json(task);
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

// ── 7-Day Green Champion Challenge ──────────────────────────

// Challenge step definitions — keywords matched against task titles
const CHALLENGE_STEPS = [
  { key: "sweep_room",      label: "Sweep your room",                   icon: "🏠", keywords: ["sweep", "clean your room", "mop"] },
  { key: "plant_water",     label: "Plant or water a plant",            icon: "🌱", keywords: ["plant", "water a plant", "seedling", "garden", "tree"] },
  { key: "plastic_bottles", label: "Collect 10 plastic bottles",        icon: "♻️", keywords: ["plastic bottle", "collect plastic", "collect 10"] },
  { key: "save_water",      label: "Save water",                        icon: "💧", keywords: ["tap", "shower", "water", "rainwater", "reuse"] },
  { key: "lights_off",      label: "Turn off unnecessary lights",       icon: "⚡", keywords: ["light", "appliance", "unplug", "energy", "solar"] },
  { key: "clean_compound",  label: "Clean your compound",               icon: "🌍", keywords: ["compound", "clean your street", "litter", "clean a public", "cleanup"] },
  { key: "eco_quiz",        label: "Complete an environmental quiz",    icon: "📚", keywords: [] }, // matched by taskType === "quiz"
];

const BONUS_POINTS = 200;

// Helper — check which step a task completes
const getStepKey = (task) => {
  if (!task) return null;
  const titleLower = task.title.toLowerCase();
  for (const step of CHALLENGE_STEPS) {
    if (step.key === "eco_quiz" && task.taskType === "quiz") return "eco_quiz";
    if (step.keywords.some(kw => titleLower.includes(kw))) return step.key;
  }
  return null;
};

// GET — user's current challenge progress
router.get("/seven-day-challenge", protect, async (req, res) => {
  try {
    let progress = await ChallengeProgress.findOne({ userId: req.user.id });
    if (!progress) {
      progress = await ChallengeProgress.create({ userId: req.user.id, completedSteps: [] });
    }
    res.json({
      steps: CHALLENGE_STEPS,
      completedSteps: progress.completedSteps,
      bonusAwarded: progress.bonusAwarded,
      allComplete: progress.completedSteps.length >= CHALLENGE_STEPS.length
    });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// POST — claim the 200pt bonus (all steps must be done, once only)
router.post("/seven-day-challenge/claim-bonus", protect, async (req, res) => {
  try {
    const progress = await ChallengeProgress.findOne({ userId: req.user.id });
    if (!progress) return res.status(400).json({ msg: "No challenge progress found." });
    if (progress.bonusAwarded) return res.status(400).json({ msg: "Bonus already claimed!" });
    if (progress.completedSteps.length < CHALLENGE_STEPS.length) {
      return res.status(400).json({ msg: `Complete all ${CHALLENGE_STEPS.length} steps first!` });
    }
    progress.bonusAwarded = true;
    progress.completedAt = new Date();
    await progress.save();
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: BONUS_POINTS } });
    res.json({ msg: `🎉 Bonus claimed! +${BONUS_POINTS} points awarded!`, pointsAwarded: BONUS_POINTS });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// ── AI Reflection Checker (GPT-4o-mini) ────────────────────
router.post("/check-reflection", protect, async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer || typeof answer !== "string") {
      return res.status(400).json({ msg: "No answer provided." });
    }

    const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 40) {
      return res.json({
        pass: false,
        wordCount,
        feedback: `Your answer is only ${wordCount} words. Write at least 40 words.`,
        missing: ["Minimum 40 words required."],
      });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey === "your_openai_api_key_here") {
      // Fallback: basic check if key not configured
      return res.status(503).json({ msg: "AI checker not configured. Please add your OPENAI_API_KEY." });
    }

    const { OpenAI } = require("openai");
    const openai = new OpenAI({ apiKey: openaiKey });

    const systemPrompt = `You are a strict but fair evaluator for a children's eco-challenge app.
A player has submitted a reflection answer about a physical outdoor activity they completed.
Your job is to check if their answer genuinely includes ALL 6 required elements.

The 6 required elements are:
1. ACTIVITY: They name the specific activity they did (e.g. planted a seed, played football, walked in a park)
2. WHAT_DID: They describe what they physically did — the actual steps or actions, not just the activity name
3. BEFORE_FEELING: They describe how they felt BEFORE starting the activity
4. AFTER_FEELING: They describe how they felt AFTER completing the activity
5. PHYSICAL_CHANGE: They mention at least one specific physical change they noticed in their body (e.g. tired, sweaty, heart racing, muscles sore, refreshed, out of breath)
6. REASON: They explain WHY their body felt that way — a reason or cause for the physical change

IMPORTANT RULES:
- Reject generic, vague answers like "I felt good" or "I felt happy" with no physical specifics
- The answer must be genuinely descriptive, not just keyword-stuffing the requirements
- A child who writes thoughtfully and mentions real physical sensations with reasons should pass
- If an element is clearly present, mark it as passed even if briefly stated
- Be strict about REASON — "because I was working hard" is acceptable; "just because" is not

Respond with ONLY valid JSON in this exact format:
{
  "pass": true or false,
  "elements": {
    "activity": true or false,
    "what_did": true or false,
    "before_feeling": true or false,
    "after_feeling": true or false,
    "physical_change": true or false,
    "reason": true or false
  },
  "feedback": "One or two sentences of friendly, specific feedback explaining what was good and what is missing. Address the player directly as 'you'.",
  "missing": ["Short label of each missing element, e.g. 'How you felt before'"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Player's answer (${wordCount} words):\n\n"${answer}"` },
      ],
      temperature: 0.1,
      max_tokens: 400,
      response_format: { type: "json_object" },
    });

    let result;
    try {
      result = JSON.parse(completion.choices[0].message.content);
    } catch {
      return res.status(500).json({ msg: "Could not parse AI response. Please try again." });
    }

    // Validate structure
    if (typeof result.pass !== "boolean" || !result.elements) {
      return res.status(500).json({ msg: "Unexpected AI response format. Please try again." });
    }

    res.json({ ...result, wordCount });
  } catch (err) {
    console.error("Reflection check error:", err.message);
    // Don't expose OpenAI errors to client
    res.status(500).json({ msg: "AI check failed. Please try again in a moment." });
  }
});

// ── Admin routes ────────────────────────────────────────────

// Screen-Free Outdoor Day game submission — awards points immediately
router.post("/submit-screenfree", protect, async (req, res) => {
  try {
    const { note, earnedPoints } = req.body;
    if (!earnedPoints || earnedPoints <= 0) return res.status(400).json({ msg: "No activities completed." });

    // Find the task
    const task = await Task.findOne({ title: "Have a Screen-Free Outdoor Day" });
    if (!task) return res.status(404).json({ msg: "Task not found." });

    // Check not already submitted today
    const today = new Date(); today.setHours(0,0,0,0);
    const existing = await Submission.findOne({
      userId: req.user.id,
      taskId: task._id,
      createdAt: { $gte: today },
      status: { $in: ["approved", "pending"] }
    });
    if (existing) return res.status(400).json({ msg: "You've already submitted this game today!" });

    // Cap points to task max
    const pts = Math.min(earnedPoints, task.points || 120);

    // Create submission and auto-approve
    const sub = await Submission.create({
      userId: req.user.id,
      taskId: task._id,
      imageUrl: "",
      note: note || "Screen-Free Outdoor Day game completed.",
      status: "approved",
      submissionIp: req.ip || "unknown",
    });

    // Award points
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: pts } });

    res.json({ msg: `🏆 Screen-Free Eco Champion! +${pts} Eco Points awarded!`, pointsAwarded: pts, submissionId: sub._id });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Get a single user's submissions (admin)
router.get("/admin/users/:id/submissions", protect, adminOnly, async (req, res) => {
  try {
    const subs = await Submission.find({ userId: req.params.id })
      .populate("taskId", "title points")
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Adjust user points (admin — can add or deduct)
router.patch("/admin/users/:id/adjust-points", protect, adminOnly, async (req, res) => {
  try {
    const { points, note } = req.body;
    if (!points || isNaN(points)) return res.status(400).json({ msg: "Invalid points value." });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { points: parseInt(points) } },
      { new: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ msg: "User not found" });
    console.log(`Admin adjusted ${user.email} by ${points} pts. Note: ${note || "none"}`);
    res.json({ msg: `Points adjusted by ${points}`, user });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

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

// Update task (imageUrl, title, description, points, etc.)
router.patch("/admin/tasks/:id", protect, adminOnly, async (req, res) => {
  try {
    const allowed = ["title", "description", "points", "imageUrl", "category", "taskType", "proofLevel"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const task = await Task.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!task) return res.status(404).json({ msg: "Task not found" });
    res.json(task);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Patch local upload images into DB as base64 (one-time fix for ephemeral filesystems)
router.post("/admin/tasks/patch-images", protect, adminOnly, async (req, res) => {
  const PATCHES = [
    { title: "Collect Plastic Bottles for Recycling", file: "bottle.jpg",      mime: "image/jpeg" },
    { title: "Clean a Public Area",                   file: "clean.avif",      mime: "image/avif" },
    { title: "Create a Small Home Garden",            file: "homegarden.jpg",  mime: "image/jpeg" },
    { title: "Fetch Water for Household Use",         file: "water.jpg",       mime: "image/jpeg" },
    { title: "Remove Weeds Around a Plant",           file: "removeweed.jpg",  mime: "image/jpeg" },
    { title: "Pick Up Litter Around Your Compound",   file: "pict.jpg",        mime: "image/jpeg" },
    { title: "Clean a Drainage Area Safely",          file: "Drainage.jpg",    mime: "image/jpeg" },
    { title: "Clean the Compound",                    file: "compound.jpg",    mime: "image/jpeg" },
    { title: "Organise Your Wardrobe",                file: "wardrope.jpg",    mime: "image/jpeg" },
    { title: "Clean the Bathroom",                    file: "bathroom.jpg",    mime: "image/jpeg" },
    { title: "Wash Clothes",                          file: "wash.jpg",        mime: "image/jpeg" },
    { title: "Wash Dishes",                           file: "washdish.jpg",    mime: "image/jpeg" },
    { title: "Close Taps Properly After Use",         file: "tap.jpg",         mime: "image/jpeg" },
    { title: "Take a Shorter Shower",                 file: "shower.jpg",      mime: "image/jpeg" },
    { title: "Check Appliances Are Off Before Leaving", file: "off.jpg",       mime: "image/jpeg" },
    { title: "Complete a 5km Plogging Run",             file: "runpick.jpg",   mime: "image/jpeg" },
    { title: "Go Car-Free for One Month",               file: "carfree.jpg",   mime: "image/jpeg" },
    { title: "Plant and Harvest a Vegetable Garden",    file: "grow.jpg",      mime: "image/jpeg" },
    { title: "Draw a Save the Earth Poster",            file: "draw.jpg",      mime: "image/jpeg" },
    { title: "Water a Plant Every Day for a Week",      file: "waterplant.jpg",mime: "image/jpeg" },
    { title: "Pick Up 10 Pieces of Litter",             file: "pick.jpg",      mime: "image/jpeg" },
    { title: "Learn 5 Recycling Facts",                 file: "recycle.jpg",   mime: "image/jpeg" },
    { title: "Plant Seeds in a Cup",                    file: "seed.jpg",      mime: "image/jpeg" },
    { title: "Teach a Friend About Recycling",          file: "teachfriend.jpg", mime: "image/jpeg" },
    { title: "Plant a Tree",                            file: "planttree1.jpg",  mime: "image/jpeg" },
    { title: "Plastic-Free Day",                        file: "plasticbag.jpg",  mime: "image/jpeg" },
    { title: "Create a Compost Pile",                   file: "compostbin.jpg",    mime: "image/jpeg" },
    { title: "Report Illegal Dumping",                  file: "report.jpg",        mime: "image/jpeg" },
    { title: "Community Clean-Up",                      file: "communityclean.jpg",mime: "image/jpeg" },
    { title: "Bike to Work",                            file: "Biketowork.jpg",    mime: "image/jpeg" },
    { title: "Reduce Energy Use",                       file: "turnoff.jpg",     mime: "image/jpeg" },
    { title: "Compost Waste",                           file: "setbin.jpg",      mime: "image/jpeg" },
    { title: "Go Car-Free for One Month",              file: "carfree.jpg",    mime: "image/jpeg" },
    { title: "Draw a Save the Earth Poster",           file: "draw.jpg",       mime: "image/jpeg" },
    { title: "Plant and Harvest a Vegetable Garden",   file: "grow.jpg",       mime: "image/jpeg" },
    { title: "Pick Up 10 Pieces of Litter",            file: "pick.jpg",       mime: "image/jpeg" },
    { title: "Learn 5 Recycling Facts",                file: "recycle.jpg",    mime: "image/jpeg" },
    { title: "Complete a 5km Plogging Run",            file: "runpick.jpg",    mime: "image/jpeg" },
    { title: "Plant Seeds in a Cup",                   file: "seed.jpg",       mime: "image/jpeg" },
    { title: "Teach a Friend About Recycling",         file: "teachfriend.jpg",mime: "image/jpeg" },
    { title: "Water a Plant Every Day for a Week",     file: "waterplant.jpg", mime: "image/jpeg" },
  ];
  const uploadsDir = path.join(__dirname, "../../uploads");
  const results = [];

  for (const patch of PATCHES) {
    const filePath = path.join(uploadsDir, patch.file);
    if (!fs.existsSync(filePath)) {
      results.push({ title: patch.title, status: "file not found" });
      continue;
    }
    const buffer = fs.readFileSync(filePath);
    const dataUrl = `data:${patch.mime};base64,${buffer.toString("base64")}`;
    const result = await Task.updateOne({ title: patch.title }, { $set: { imageUrl: dataUrl } });
    results.push({
      title: patch.title,
      status: result.matchedCount === 0 ? "task not found" : result.modifiedCount > 0 ? "updated" : "already set"
    });
  }

  res.json({ results });
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

// Approve submission → award points + send email
router.patch("/admin/submissions/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id).populate("taskId").populate("userId", "name email");
    if (!sub) return res.status(404).json({ msg: "Submission not found" });
    if (sub.status === "approved") return res.status(400).json({ msg: "Already approved" });
    sub.status = "approved";
    await sub.save();
    if (sub.taskId) {
      // ── Earning cap check ──────────────────────────────
      const { daily, weekly } = await getEarningTotals(sub.userId);
      const taskPts = sub.taskId.points || 0;
      if (daily + taskPts > DAILY_POINTS_CAP) {
        return res.status(400).json({
          msg: `Daily earning cap reached (${DAILY_POINTS_CAP} pts/day). This approval would exceed it. Try again tomorrow.`
        });
      }
      if (weekly + taskPts > WEEKLY_POINTS_CAP) {
        return res.status(400).json({
          msg: `Weekly earning cap reached (${WEEKLY_POINTS_CAP} pts/week). This approval would exceed the weekly limit.`
        });
      }
      // Check if this is the daily challenge — award 1.5× bonus
      const tasks = await Task.find({ taskType: { $ne: "quiz" } });
      let pointsToAward = sub.taskId.points;
      if (tasks.length) {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const dailyTask = tasks[dayOfYear % tasks.length];
        if (dailyTask._id.toString() === sub.taskId._id.toString()) {
          pointsToAward = Math.round(sub.taskId.points * 1.5); // 50% daily bonus
        }
      }

      // Update streak
      const user = await User.findById(sub.userId);
      const today = new Date(); today.setHours(0,0,0,0);
      const lastDate = user.lastSubmissionDate ? new Date(user.lastSubmissionDate) : null;
      if (lastDate) lastDate.setHours(0,0,0,0);
      const isYesterday = lastDate && (today - lastDate) === 86400000;
      const isToday = lastDate && today.getTime() === lastDate.getTime();
      const newStreak = isYesterday ? (user.streakDays || 0) + 1 : isToday ? (user.streakDays || 0) : 1;

      await User.findByIdAndUpdate(sub.userId, {
        $inc: { points: pointsToAward },
        streakDays: newStreak,
        lastSubmissionDate: new Date()
      });

      // Check streak milestones (7-day, 30-day bonuses)
      await checkStreakMilestones(sub.userId, newStreak);

      // Mark 7-day challenge step if applicable
      const stepKey = getStepKey(sub.taskId);
      if (stepKey) {
        await ChallengeProgress.findOneAndUpdate(
          { userId: sub.userId },
          { $addToSet: { completedSteps: stepKey } },
          { upsert: true, new: true }
        );
      }
      // Send approval email
      if (sub.userId?.email) {
        sendApprovalEmail(sub.userId, sub.taskId.title, sub.taskId.points).catch(err =>
          console.error("Approval email failed:", err.message)
        );
      }
    }
    res.json({ msg: "Approved", submission: sub });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// Send reminder emails to users with no submissions
router.post("/admin/send-reminders", protect, adminOnly, async (req, res) => {
  try {
    // Find all non-admin users
    const users = await User.find({ isAdmin: false }, "name email");
    // Find users who have at least one submission
    const activeUserIds = await Submission.distinct("userId");
    // Filter users with NO submissions
    const inactiveUsers = users.filter(
      u => !activeUserIds.some(id => id.toString() === u._id.toString())
    );

    if (inactiveUsers.length === 0) {
      return res.json({ msg: "All users have already submitted at least one task!", sent: 0 });
    }

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const user of inactiveUsers) {
      try {
        await sendTaskReminder(user);
        sent++;
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        failed++;
        errors.push({ email: user.email, error: err.message });
      }
    }

    res.json({
      msg: `Reminders sent! ${sent} emails delivered, ${failed} failed.`,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined
    });
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

    // ── Redemption Guards ───────────────────────────────
    // 1. Minimum level
    const userLevel = getLevelFromPoints(user.points || 0);
    if (userLevel < MIN_LEVEL_TO_REDEEM) {
      return res.status(403).json({
        msg: `You need to reach Level ${MIN_LEVEL_TO_REDEEM} (Green Helper — 501 pts) before redeeming rewards. Keep completing tasks!`
      });
    }

    // 2. Minimum account age
    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt)) / 86400000);
    if (accountAgeDays < MIN_ACCOUNT_AGE_DAYS) {
      return res.status(403).json({
        msg: `Your account must be at least ${MIN_ACCOUNT_AGE_DAYS} days old to redeem rewards. You joined ${accountAgeDays} day(s) ago.`
      });
    }

    // 3. Redemption cooldown
    const recentRedemption = await Redemption.findOne({
      userId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: new Date(Date.now() - REDEMPTION_COOLDOWN_DAYS * 86400000) }
    });
    if (recentRedemption) {
      const nextDate = new Date(recentRedemption.createdAt);
      nextDate.setDate(nextDate.getDate() + REDEMPTION_COOLDOWN_DAYS);
      return res.status(429).json({
        msg: `You can only redeem once every ${REDEMPTION_COOLDOWN_DAYS} days. Next redemption available: ${nextDate.toLocaleDateString()}.`
      });
    }

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
