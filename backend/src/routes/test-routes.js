// Test Routes - For verifying OpenAI integration and system health
const express = require("express");
const router = express.Router();
const openaiService = require("../services/openai-service");

// Test OpenAI connection
router.get("/openai-test", async (req, res) => {
  try {
    const result = await openaiService.testConnection();
    res.json({
      success: true,
      message: "OpenAI test completed",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "OpenAI test failed",
      error: error.message,
    });
  }
});

// Test travel plan generation with sample data
router.post("/openai-travel-test", async (req, res) => {
  try {
    const samplePrompt = `
    You are an AI Travel Planning Assistant. Generate a realistic, human-friendly travel plan for Jaipur, India for 3 days with a budget of 15000 INR. The traveler wants a balanced experience with mix of activities and relaxation.
    
    Output format:
    {
      "tripOverview": {
        "destination": "Jaipur, India",
        "duration": 3,
        "travelStyle": "balanced",
        "travelType": "general",
        "totalBudget": 15000
      },
      "budgetBreakdown": {
        "stay": { "amount": 6000, "description": "Mid-range hotel for 3 nights" },
        "food": { "amount": 3750, "description": "Mix of local restaurants and street food" },
        "transport": { "amount": 2250, "description": "Local transport and taxi rides" },
        "activities": { "amount": 2250, "description": "Entry fees and guided tours" },
        "contingency": { "amount": 750, "description": "Emergency buffer" }
      },
      "dailyItinerary": [
        {
          "day": 1,
          "date": "2026-03-27",
          "activities": ["Morning: Visit Amber Fort", "Afternoon: Explore Jaigarh Fort", "Evening: Shopping at Johari Bazaar"],
          "meals": ["Breakfast at hotel", "Lunch at rooftop restaurant", "Dinner at traditional Rajasthani restaurant"],
          "accommodation": "Hotel in central Jaipur",
          "notes": "Start with major forts to beat crowds"
        }
      ],
      "safetyNotes": "Jaipur is generally safe for tourists. Stay in well-reviewed hotels in central areas. Be cautious with street food hygiene and use registered taxis."
    }
    `;

    const result = await openaiService.generateTravelPlan(samplePrompt);

    res.json({
      success: true,
      message: "OpenAI travel test completed",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "OpenAI travel test failed",
      error: error.message,
    });
  }
});

module.exports = router;
