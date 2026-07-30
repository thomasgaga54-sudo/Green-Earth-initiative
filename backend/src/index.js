const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/user.route");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);

// Serve React frontend in production
const frontendPath = path.resolve(__dirname, "../frontend/dist");
console.log("Frontend path:", frontendPath);
app.use(express.static(frontendPath));

// All non-API routes serve the React app
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
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
