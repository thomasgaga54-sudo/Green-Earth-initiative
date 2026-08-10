const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const ip = req.registrationIp || req.ip || "unknown";

    // Basic validation
    if (!name || !email || !password) return res.status(400).json({ msg: "All fields are required" });
    if (password.length < 6) return res.status(400).json({ msg: "Password must be at least 6 characters" });
    if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ msg: "Invalid email address" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ msg: "Email already registered" });

    // Check for too many accounts from same IP
    const ipCount = await User.countDocuments({ registrationIp: ip });
    let flaggedForReview = false;
    let flagReason = null;
    if (ipCount >= 3) {
      flaggedForReview = true;
      flagReason = "multiple_accounts_same_ip";
    }

    const hashed = await bcrypt.hash(password, 12); // Increased rounds to 12
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      registrationIp: ip,
      flaggedForReview,
      flagReason
    });

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ user: userObj, token: generateToken(user) });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || "unknown";

    if (!email || !password) return res.status(400).json({ msg: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Generic message to prevent user enumeration
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        msg: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      // Increment failed attempts
      const attempts = (user.loginAttempts || 0) + 1;
      const update = { loginAttempts: attempts };

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        update.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        update.loginAttempts = 0;
        await User.findByIdAndUpdate(user._id, update);
        return res.status(423).json({
          msg: `Too many failed attempts. Account locked for 30 minutes.`
        });
      }

      await User.findByIdAndUpdate(user._id, update);
      return res.status(401).json({
        msg: `Invalid email or password. ${MAX_LOGIN_ATTEMPTS - attempts} attempt(s) remaining.`
      });
    }

    // Successful login — reset lockout, record login metadata
    await User.findByIdAndUpdate(user._id, {
      loginAttempts: 0,
      lockUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ user: userObj, token: generateToken(user) });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

module.exports = { register, login };
