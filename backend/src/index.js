const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const userRoutes = require("./routes/user.route");

const app = express();
app.use(cors());
app.use(express.json());

// File upload storage — saves to backend/uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});

// Serve uploaded images publicly
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Upload endpoint
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
  const imageUrl = `/uploads/${req.file.filename}`;
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
