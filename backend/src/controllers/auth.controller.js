const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");

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

    // Check email already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already registered" });

    // Check how many accounts from this IP
    const ipCount = await User.countDocuments({ registrationIp: ip });
    let flaggedForReview = false;
    let flagReason = null;

    if (ipCount >= 3) {
      // More than 3 accounts from same IP — flag for review
      flaggedForReview = true;
      flagReason = "multiple_accounts_same_ip";
      console.warn(`⚠️  Fraud alert: ${ip} has registered ${ipCount + 1} accounts`);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      registrationIp: ip,
      flaggedForReview,
      flagReason
    });

    res.json({ user, token: generateToken(user) });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });
    res.json({ user, token: generateToken(user) });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

module.exports = { register, login };
