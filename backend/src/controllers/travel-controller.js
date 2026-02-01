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

// AI trip planning endpoint (full plan)
const createTravelPlan = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      travelType,
      constraints
    } = req.body;

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
        received: Object.keys(req.body)
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
    if (budget <= 0 || isNaN(Number(budget))) {
      return res.status(400).json({
        error: "Budget must be a positive number",
      });
    }

    // Use default values if not provided
    const validatedTravelType = travelType || "general";
    const validatedConstraints = Array.isArray(constraints) ? constraints : [];

    // Generate travel plan using AI service
    const travelPlan = await aiService.generateTravelPlan(
      destination,
      startDate,
      endDate,
      Number(budget),
      travelStyle,
      validatedTravelType,
      validatedConstraints
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

// Modular generation endpoints
const generateItinerary = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      travelType,
      constraints
    } = req.body;

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

    // Use default values if not provided
    const validatedTravelType = travelType || "general";
    const validatedConstraints = Array.isArray(constraints) ? constraints : [];

    // Generate only itinerary using AI service
    const itinerary = await aiService.generateItinerary(
      destination,
      startDate,
      endDate,
      Number(budget),
      travelStyle,
      validatedTravelType,
      validatedConstraints
    );

    res.status(200).json({
      message: "Itinerary generated successfully",
      data: itinerary,
    });
  } catch (error) {
    console.error("Error in generateItinerary:", error);
    res.status(500).json({
      error: "Failed to generate itinerary",
      message: error.message,
    });
  }
};

const generateMeals = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      travelType,
      constraints
    } = req.body;

    // Basic validation
    if (!destination || !startDate || !endDate || !budget) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "destination",
          "startDate",
          "endDate",
          "budget",
        ],
      });
    }

    // Use default values if not provided
    const validatedTravelType = travelType || "general";
    const validatedConstraints = Array.isArray(constraints) ? constraints : [];

    // Generate only meal options using AI service
    const meals = await aiService.generateMeals(
      destination,
      startDate,
      endDate,
      Number(budget),
      travelStyle,
      validatedTravelType,
      validatedConstraints
    );

    res.status(200).json({
      message: "Meal options generated successfully",
      data: meals,
    });
  } catch (error) {
    console.error("Error in generateMeals:", error);
    res.status(500).json({
      error: "Failed to generate meal options",
      message: error.message,
    });
  }
};

const generateAccommodation = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      travelType,
      constraints
    } = req.body;

    // Basic validation
    if (!destination || !startDate || !endDate || !budget) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "destination",
          "startDate",
          "endDate",
          "budget",
        ],
      });
    }

    // Use default values if not provided
    const validatedTravelType = travelType || "general";
    const validatedConstraints = Array.isArray(constraints) ? constraints : [];

    // Generate only accommodation options using AI service
    const accommodation = await aiService.generateAccommodation(
      destination,
      startDate,
      endDate,
      Number(budget),
      travelStyle,
      validatedTravelType,
      validatedConstraints
    );

    res.status(200).json({
      message: "Accommodation options generated successfully",
      data: accommodation,
    });
  } catch (error) {
    console.error("Error in generateAccommodation:", error);
    res.status(500).json({
      error: "Failed to generate accommodation options",
      message: error.message,
    });
  }
};

const generateTransport = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      travelType,
      constraints
    } = req.body;

    // Basic validation
    if (!destination || !startDate || !endDate || !budget) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "destination",
          "startDate",
          "endDate",
          "budget",
        ],
      });
    }

    // Use default values if not provided
    const validatedTravelType = travelType || "general";
    const validatedConstraints = Array.isArray(constraints) ? constraints : [];

    // Generate only transport options using AI service
    const transport = await aiService.generateTransport(
      destination,
      startDate,
      endDate,
      Number(budget),
      travelStyle,
      validatedTravelType,
      validatedConstraints
    );

    res.status(200).json({
      message: "Transport options generated successfully",
      data: transport,
    });
  } catch (error) {
    console.error("Error in generateTransport:", error);
    res.status(500).json({
      error: "Failed to generate transport options",
      message: error.message,
    });
  }
};

module.exports = {
  getHealth,
  createTravelPlan,
  generateItinerary,
  generateMeals,
  generateAccommodation,
  generateTransport,
};