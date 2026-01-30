// Server configuration
const PORT = process.env.PORT || 3004;

// CORS configuration
const CORS_OPTIONS = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

// Environment check
const IS_PRODUCTION = process.env.NODE_ENV === "production";

module.exports = {
  PORT,
  CORS_OPTIONS,
  IS_PRODUCTION,
};
