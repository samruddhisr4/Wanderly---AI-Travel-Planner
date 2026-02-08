const express = require("express");
const router = express.Router();
const userTravelController = require("../controllers/user-travel-controller");
const authMiddleware = require("../middleware/auth");

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// Save travel plan for user
router.post("/plans", userTravelController.saveTravelPlan);

// Get all travel plans for user
router.get("/plans", userTravelController.getUserTravelPlans);

// Update travel plan
router.put("/plans/:planId", userTravelController.updateTravelPlan);

// Delete travel plan
router.delete("/plans/:planId", userTravelController.deleteTravelPlan);

module.exports = router;
