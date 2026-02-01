const express = require("express");
const {
  getHealth,
  createTravelPlan,
  generateItinerary,
  generateMeals,
  generateAccommodation,
  generateTransport
} = require("../controllers/travel-controller");

const router = express.Router();

// Health check route
router.get("/health", getHealth);

// AI travel plan generation route (full plan)
router.post("/travel/plan", createTravelPlan);

// Modular generation routes
router.post("/travel/itinerary", generateItinerary);
router.post("/travel/meals", generateMeals);
router.post("/travel/accommodation", generateAccommodation);
router.post("/travel/transport", generateTransport);

module.exports = router;