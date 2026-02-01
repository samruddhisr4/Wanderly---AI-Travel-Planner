const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config({ path: __dirname + '/.env' });

console.log('OPENAI_API_KEY loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
console.log('API Key preview:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'Not found');

// Import routes
const travelRoutes = require("./src/routes/travel-routes");
const testRoutes = require("./src/routes/test-routes");

// Import configuration
const { PORT, CORS_OPTIONS } = require("./src/config/server-config");

// Initialize Express app
const app = express();

// Middleware
app.use(cors(CORS_OPTIONS));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", travelRoutes);
app.use("/api/test", testRoutes);

// Health check route at root level
app.get("/", (req, res) => {
  res.json({
    message: "Travel Planner API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
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
