const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load environment variables from .env file
dotenv.config({ path: __dirname + "/.env" });

console.log(
  "OPENAI_API_KEY loaded:",
  process.env.OPENAI_API_KEY ? "Yes" : "No"
);
console.log(
  "API Key preview:",
  process.env.OPENAI_API_KEY
    ? process.env.OPENAI_API_KEY.substring(0, 10) + "..."
    : "Not found"
);

// Import routes
const travelRoutes = require("./src/routes/travel-routes");
const testRoutes = require("./src/routes/test-routes");
const authRoutes = require("./src/routes/auth-routes");
const userTravelRoutes = require("./src/routes/user-travel-routes");

// Import configuration
const { PORT, CORS_OPTIONS } = require("./src/config/server-config");

// Initialize Express app
const app = express();

// Database connection
// Database connection
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/wanderly_travel_planner";
console.log("Attempting to connect to MongoDB...");
console.log("URI (masked):", uri.replace(/:([^:@]+)@/, ':****@'));

mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));


// Middleware
app.use(cors(CORS_OPTIONS));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", travelRoutes);
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/travel", userTravelRoutes);

// Health check route at root level
app.get("/", (req, res) => {
  res.json({
    message: "Travel Planner API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint to check DB connection - Trigger 2026-02-09
app.get("/api/debug-db", async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    res.json({
      status: "ok",
      dbState: states[state] || "unknown",
      env: process.env.NODE_ENV,
      mongoUriConfigured: !!process.env.MONGODB_URI,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
