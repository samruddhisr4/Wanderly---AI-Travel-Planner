// Server configuration
const PORT = process.env.PORT || 3005;

// CORS configuration
// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://wanderly-ai-travel-planner-chi.vercel.app", // Explicitly allow Vercel app
  process.env.FRONTEND_URL // Allow env var override
].filter(Boolean); // Remove nulls/undefined

const CORS_OPTIONS = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is allowed
    // We remove trailing slashes for comparison just in case
    const normalizedOrigin = origin.replace(/\/$/, "");
    const isAllowed = allowedOrigins.some(allowed =>
      allowed && allowed.replace(/\/$/, "") === normalizedOrigin
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log("CORS Blocked:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
