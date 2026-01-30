const express = require("express");
const {
  getHealth,
  createTravelPlan,
} = require("../controllers/travel-controller");

const router = express.Router();

// Health check route
router.get("/health", getHealth);

// AI travel plan generation route
router.post("/travel/plan", createTravelPlan);

module.exports = router;
