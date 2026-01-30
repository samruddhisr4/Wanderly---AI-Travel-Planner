// Travel controller - handles all travel-related requests

// Health check endpoint
const getHealth = (req, res) => {
  res.json({
    status: "healthy",
    service: "Travel Planner API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
};

// AI service import
const aiService = require("../services/ai-service");

// Future AI trip planning endpoint
const createTravelPlan = async (req, res) => {
  try {
    const { destination, startDate, endDate, budget, travelStyle } = req.body;

    // Basic validation
    if (!destination || !startDate || !endDate || !budget || !travelStyle) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "destination",
          "startDate",
          "endDate",
          "budget",
          "travelStyle",
        ],
      });
    }

    // Validate travel style
    const validStyles = ["chill", "balanced", "fast-paced"];
    if (!validStyles.includes(travelStyle)) {
      return res.status(400).json({
        error: "Invalid travel style",
        validStyles: validStyles,
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return res.status(400).json({
        error: "Start date must be before end date",
      });
    }

    // Validate budget
    if (budget <= 0 || isNaN(budget)) {
      return res.status(400).json({
        error: "Budget must be a positive number",
      });
    }

    // Generate travel plan using AI service
    const travelPlan = await aiService.generateTravelPlan(
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      req.body.travelType,
      req.body.constraints
    );

    res.status(200).json({
      message: "Travel plan generated successfully",
      data: travelPlan,
    });
  } catch (error) {
    console.error("Error in createTravelPlan:", error);
    res.status(500).json({
      error: "Failed to generate travel plan",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

module.exports = {
  getHealth,
  createTravelPlan,
};
