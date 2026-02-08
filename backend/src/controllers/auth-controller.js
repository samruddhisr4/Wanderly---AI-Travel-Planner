const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const dataStore = require("../data/inMemoryStore");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide name, email, and password",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Check if user already exists in memory
      const existingUser = dataStore.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Create new user in memory
      const newUser = {
        _id: Date.now().toString(), // Simple ID generation
        name,
        email,
        password: bcryptjs.hashSync(password, 8), // Hash password synchronously
        travelPlans: [],
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      dataStore.addUser(newUser);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: newUser._id,
          email: newUser.email,
          name: newUser.name,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Update last login
      newUser.lastLogin = new Date();

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during registration",
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide email and password",
        });
      }

      // Find user by email in memory
      const user = dataStore.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Check password
      const isPasswordValid = bcryptjs.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Update last login
      user.lastLogin = new Date();

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during login",
      });
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const user = dataStore.findUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

module.exports = new AuthController();
