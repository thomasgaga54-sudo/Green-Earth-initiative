const { Submission, User } = require("../models/user.model");

// Track in-memory request counts (resets on server restart — fine for basic abuse prevention)
const ipSubmissionTracker = new Map(); // ip -> { count, windowStart }
const userSubmissionTracker = new Map(); // userId -> { count, windowStart }

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_HOUR = 5; // max task submissions per user per hour
const MAX_SUBMISSIONS_PER_IP = 10;  // max submissions per IP per hour

/**
 * Checks for fraud signals on task submission:
 * 1. Duplicate: user already submitted this task
 * 2. User rate limit: too many submissions in 1 hour
 * 3. IP rate limit: too many submissions from same IP
 * 4. Velocity: submission within 60 seconds of account creation
 */
const fraudCheck = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const now = Date.now();

    // 1. Duplicate submission check
    const existing = await Submission.findOne({ userId, taskId });
    if (existing) {
      return res.status(409).json({
        msg: "You have already submitted this task.",
        fraudFlag: "duplicate_submission"
      });
    }

    // 2. User submission rate limit
    const userTrack = userSubmissionTracker.get(userId) || { count: 0, windowStart: now };
    if (now - userTrack.windowStart > WINDOW_MS) {
      userTrack.count = 0;
      userTrack.windowStart = now;
    }
    if (userTrack.count >= MAX_SUBMISSIONS_PER_HOUR) {
      await User.findByIdAndUpdate(userId, { $set: { flaggedForReview: true, flagReason: "rate_limit_exceeded" } });
      return res.status(429).json({
        msg: `You can only submit ${MAX_SUBMISSIONS_PER_HOUR} tasks per hour. Please slow down.`,
        fraudFlag: "rate_limit_exceeded"
      });
    }
    userTrack.count++;
    userSubmissionTracker.set(userId, userTrack);

    // 3. IP rate limit
    const ipTrack = ipSubmissionTracker.get(ip) || { count: 0, windowStart: now };
    if (now - ipTrack.windowStart > WINDOW_MS) {
      ipTrack.count = 0;
      ipTrack.windowStart = now;
    }
    if (ipTrack.count >= MAX_SUBMISSIONS_PER_IP) {
      await User.findByIdAndUpdate(userId, { $set: { flaggedForReview: true, flagReason: "ip_rate_limit" } });
      return res.status(429).json({
        msg: "Too many submissions from your network. Please try again later.",
        fraudFlag: "ip_rate_limit"
      });
    }
    ipTrack.count++;
    ipSubmissionTracker.set(ip, ipTrack);

    // 4. Account velocity: was account created very recently? (< 5 mins)
    const user = await User.findById(userId);
    if (user && user.createdAt) {
      const accountAgeMs = now - new Date(user.createdAt).getTime();
      if (accountAgeMs < 2 * 60 * 1000) {
        // Only flag if submitting within 2 minutes of registration AND also has other signals
        // Don't flag on first honest submission
        req.fraudFlags = req.fraudFlags || [];
        req.fraudFlags.push("new_account_submission");
      }
    }

    // 5. Check if user is already flagged
    if (user?.flaggedForReview) {
      req.fraudFlags = req.fraudFlags || [];
      req.fraudFlags.push("flagged_account");
    }

    next();
  } catch (err) {
    console.error("Fraud check error:", err);
    next(); // Don't block submission if fraud check itself errors
  }
};

/**
 * Attaches registration IP to user for multi-account detection
 */
const trackRegistrationIP = (req, res, next) => {
  req.registrationIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
  next();
};

module.exports = { fraudCheck, trackRegistrationIP };
