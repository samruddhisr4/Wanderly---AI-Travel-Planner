const jwt = require("jsonwebtoken");
const dataStore = require("../data/inMemoryStore");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

const authMiddleware = async (req, res, next) => {
  try {
    console.log("=== AUTH MIDDLEWARE CALLED ===");
    console.log("Headers:", req.headers);

    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    console.log("Auth Header:", authHeader);

    const token = authHeader?.replace("Bearer ", "");
    console.log("Token:", token);

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    console.log("Verifying token...");
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token verified, decoded:", decoded);

    console.log("Decoded user ID:", decoded.userId);
    console.log("Current users in store:", dataStore.users);

    // For in-memory storage, just verify the token contains valid user data
    // We'll verify if the user exists by checking against our in-memory store
    const userExists = dataStore.findUserById(decoded.userId) !== undefined;
    console.log("User exists:", userExists);

    if (!userExists) {
      console.log("User not found in store");
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    req.user = decoded;
    console.log("Middleware: User set on request", req.user);
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
