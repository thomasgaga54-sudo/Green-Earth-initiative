const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./routes/user.route");
const paymentRoutes = require("./routes/payment.route");

const app = express();

// ── Trust Render's proxy (required for rate limiting + IP detection) ─
app.set("trust proxy", 1);

// ── Security Headers (Helmet) ──────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins — frontend and backend are same-origin via Render
    return callback(null, true);
  },
  credentials: true,
}));

// ── Stripe Webhook (raw body — must come BEFORE express.json) ─
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

// ── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// ── Manual NoSQL Injection Prevention ─────────────────────
// Strip keys starting with $ or containing . from body (Express 5 compatible)
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };
  if (req.body) sanitize(req.body);
  next();
});

// ── Global Rate Limit ──────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { msg: "Too many requests from this IP. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ── Auth Rate Limit ────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { msg: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

// File upload — use memory storage, convert to base64 and store in DB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});

// Serve uploaded images publicly (for any locally stored images)
app.use("/uploads", express.static(uploadsDir));

// Upload endpoint — stores image as base64 data URL
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
  // Convert to base64 data URL — works on any hosting without filesystem
  const base64 = req.file.buffer.toString("base64");
  const imageUrl = `data:${req.file.mimetype};base64,${base64}`;
  res.json({ imageUrl });
});

app.use("/api", userRoutes);
app.use("/api/payment", paymentRoutes);

// Serve React frontend in production
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ msg: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

// Start server first, then connect to MongoDB
app.listen(PORT, () => console.log("Server running on port", PORT));

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;

if (!mongoUri) {
  console.error("WARNING: MONGO_URI is not set. Database features will not work.");
} else {
  mongoose.connect(mongoUri)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB connection error:", err));
}
