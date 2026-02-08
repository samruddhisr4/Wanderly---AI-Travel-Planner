const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

const authMiddleware = async (req, res, next) => {
  try {
    console.log("=== AUTH MIDDLEWARE VERIFIED (NO DATASTORE) ===");

    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("User decoded:", decoded.userId);

    // Verify if the user exists in the database
    // We use require inside function to avoid circular dependency if any
    const User = require("../models/User");
    const userExists = await User.findById(decoded.userId);

    if (!userExists) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token: " + error.message,
    });
  }
};

module.exports = authMiddleware;
