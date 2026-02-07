const express = require("express");
const router = express.Router();

router.post("/generate-itinerary", (req, res) => {
  router.post("/generate-itinerary", (req, res) => {
    // Logic to generate itinerary based on user input
    const itinerary = generateItinerary(req.body);
    res.json(itinerary);
  });

  function generateItinerary(data) {
    // Sample itinerary generation logic
    return {
      days: [
        {
          day: 1,
          activities: ["Visit Museum", "Lunch at Cafe"],
          buttons: {
            meal: "Meal Suggestions",
            accommodation: "Accommodation Suggestions",
            transport: "Transport Options",
          },
        },
      ],
    };
  }

  module.exports = router;
  const itinerary = generateItinerary(req.body);
  res.json(itinerary);
});

function generateItinerary(data) {
  // Sample itinerary generation logic
  return {
    days: [
      {
        day: 1,
        activities: ["Visit Museum", "Lunch at Cafe"],
        buttons: {
          meal: "Meal Suggestions",
          accommodation: "Accommodation Suggestions",
          transport: "Transport Options",
        },
      },
    ],
  };
}

module.exports = router;
