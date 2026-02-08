const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth-controller");

// Register new user
router.post("/register", authController.register);

// Login user
router.post("/login", authController.login);

// Get user profile (protected route)
const authMiddleware = require("../middleware/auth");
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;
