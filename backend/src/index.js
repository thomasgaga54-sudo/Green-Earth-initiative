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

const app = express();

// ── Security Headers (Helmet) ──────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    if (origin && origin.includes("onrender.com")) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

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

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;

if (!mongoUri) {
  console.error("ERROR: MONGO_URI or MONGODB_URL environment variable is not set. Please configure it in your deployment environment.");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
