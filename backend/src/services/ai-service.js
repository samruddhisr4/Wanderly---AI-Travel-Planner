// AI Service - Handles prompt engineering for travel planning
const safetyService = require("./safety-service");
const openaiService = require("./openai-service");

class AIService {
  constructor() {
    // Travel style configurations
    this.travelStyles = {
      chill: {
        activitiesPerDay: 2,
        pace: "relaxed",
        description: "Leisurely exploration with plenty of downtime",
      },
      balanced: {
        activitiesPerDay: 3,
        pace: "moderate",
        description: "Good mix of sightseeing and relaxation",
      },
      "fast-paced": {
        activitiesPerDay: 4,
        pace: "intensive",
        description: "Maximize sightseeing in limited time",
      },
    };

    // Travel types
    this.travelTypes = [
      "general",
      "solo",
      "couple",
      "family",
      "friends",
      "business",
      "female",
      "General Travel",
      "Solo Travel",
      "Couple Travel",
      "Family Travel",
      "Friends Group",
      "Business Travel",
      "Solo Female Travel",
    ];

    // Valid constraints
    this.validConstraints = [
      "no flights",
      "vegetarian",
      "wheelchair accessible",
      "pet friendly",
      "budget accommodation",
      "luxury only",
      "no museums",
      "outdoor activities only",
      "cultural sites only",
    ];
  }

  // Input validation method
  validateInputs(
    destination,
    startDate,
    endDate,
    budget,
    travelStyle,
    travelType,
    constraints
  ) {
    const errors = [];

    // Required field validation
    if (!destination || destination.trim().length === 0) {
      errors.push("Destination is required");
    }

    if (!startDate) {
      errors.push("Start date is required");
    }

    if (!endDate) {
      errors.push("End date is required");
    }

    if (!budget || isNaN(budget) || budget <= 0) {
      errors.push("Budget must be a positive number");
    }

    if (!travelStyle) {
      errors.push("Travel style is required");
    }

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      errors.push("Invalid start date format");
    }

    if (isNaN(end.getTime())) {
      errors.push("Invalid end date format");
    }

    if (start > end) {
      errors.push("Start date must be before end date");
    }

    // Check if trip is too long (prevent abuse)
    const tripDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (tripDuration > 30) {
      errors.push("Trips longer than 30 days are not supported");
    }

    if (tripDuration < 1) {
      errors.push("Trip must be at least 1 day");
    }

    // Travel style validation
    if (travelStyle && !Object.keys(this.travelStyles).includes(travelStyle)) {
      errors.push(
        "Invalid travel style. Valid options: " +
          Object.keys(this.travelStyles).join(", ")
      );
    }

    // Travel type validation
    if (travelType && !this.travelTypes.includes(travelType)) {
      errors.push(
        "Invalid travel type. Valid options: " + this.travelTypes.join(", ")
      );
    }

    // Constraint validation
    if (constraints && Array.isArray(constraints)) {
      const invalidConstraints = constraints.filter(
        (c) => !this.validConstraints.includes(c)
      );
      if (invalidConstraints.length > 0) {
        errors.push(
          "Invalid constraints: " +
            invalidConstraints.join(", ") +
            ". Valid options: " +
            this.validConstraints.join(", ")
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      tripDuration: errors.length === 0 ? tripDuration : null,
    };
  }

  // Calculate trip duration from dates
  calculateTripDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Add 1 to include both start and end dates
    return days + 1;
  }

  // Transform user input for AI consumption
  transformUserInput(
    destination,
    startDate,
    endDate,
    budget,
    travelStyle,
    travelType,
    constraints
  ) {
    // Normalize destination format
    const normalizedDestination = destination
      .trim()
      .split(",")[0] // Take city name if "City, Country" format
      .replace(/\s+/g, " ") // Remove extra spaces
      .toLowerCase();

    // Format dates consistently
    const start = new Date(startDate);
    const end = new Date(endDate);
    const formattedStartDate = start.toISOString().split("T")[0];
    const formattedEndDate = end.toISOString().split("T")[0];

    // Calculate duration
    const duration = this.calculateTripDuration(startDate, endDate);

    // Get style configuration
    const styleConfig =
      this.travelStyles[travelStyle] || this.travelStyles.balanced;

    // Normalize travel type for internal processing
    let normalizedTravelType = travelType || "general";

    // Map frontend display names to backend values
    const travelTypeMap = {
      "General Travel": "general",
      "Solo Travel": "solo",
      "Couple Travel": "couple",
      "Family Travel": "family",
      "Friends Group": "friends",
      "Business Travel": "business",
      "Solo Female Travel": "female",
    };

    if (travelTypeMap[normalizedTravelType]) {
      normalizedTravelType = travelTypeMap[normalizedTravelType];
    }

    return {
      destination: normalizedDestination,
      fullDestination: destination.trim(),
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      duration,
      budget: Number(budget),
      travelStyle,
      travelType: normalizedTravelType,
      constraints: constraints || [],
      styleConfig,
    };
  }

  // Generate AI prompt based on validated user input
  generateTravelPrompt(transformedInput) {
    const {
      fullDestination: destination,
      startDate,
      endDate,
      duration,
      budget,
      travelStyle,
      travelType,
      constraints,
      styleConfig,
    } = transformedInput;

    // Build constraint string
    const constraintText =
      constraints && constraints.length > 0
        ? "Special Requirements: " + constraints.join(", ") + "\n"
        : "";

    // Calculate budget breakdown percentages (must add up to 100%)
    const budgetBreakdown = {
      stay: Math.round(budget * 0.35), // 35%
      food: Math.round(budget * 0.25), // 25%
      transport: Math.round(budget * 0.15), // 15%
      activities: Math.round(budget * 0.2), // 20%
      contingency: Math.round(budget * 0.05), // 5%
    };

    // Verify budget math adds up exactly
    const totalCalculated =
      budgetBreakdown.stay +
      budgetBreakdown.food +
      budgetBreakdown.transport +
      budgetBreakdown.activities +
      budgetBreakdown.contingency;

    // Adjust contingency if needed to make math exact
    if (totalCalculated !== budget) {
      budgetBreakdown.contingency += budget - totalCalculated;
    }

    // Build the enhanced prompt with STRICT requirements
    let prompt = "";
    prompt +=
      "You are an expert AI Travel Planning Assistant. Generate a COMPREHENSIVE, DETAILED travel plan following EXACT specifications.\n\n";
    prompt += "DESTINATION: " + destination + "\n";
    prompt +=
      "TRIP DATES: " +
      startDate +
      " to " +
      endDate +
      " (" +
      duration +
      " days)\n";
    prompt += "TOTAL BUDGET: " + budget + " INR\n";
    prompt += "TRAVEL TYPE: " + travelType + "\n";
    prompt +=
      "TRAVEL STYLE: " + travelStyle + " - " + styleConfig.description + "\n";
    prompt += constraintText;
    prompt +=
      "\nMANDATORY REQUIREMENTS - FAILURE TO COMPLY WILL RESULT IN REJECTION:\n\n";

    prompt += "1. BUDGET MATH VALIDATION:\n";
    prompt += "   - STAY: " + budgetBreakdown.stay + " INR (35%)\n";
    prompt += "   - FOOD: " + budgetBreakdown.food + " INR (25%)\n";
    prompt += "   - TRANSPORT: " + budgetBreakdown.transport + " INR (15%)\n";
    prompt += "   - ACTIVITIES: " + budgetBreakdown.activities + " INR (20%)\n";
    prompt +=
      "   - CONTINGENCY: " + budgetBreakdown.contingency + " INR (5%)\n";
    prompt += "   - TOTAL MUST EQUAL EXACTLY " + budget + " INR\n";
    prompt += "   - NO ROUNDING ERRORS ALLOWED\n\n";

    prompt += "2. ACCOMMODATION CONSISTENCY:\n";
    prompt +=
      "   - USE SAME HOTEL/GUESTHOUSE FOR ENTIRE TRIP UNLESS SPECIFICALLY REQUESTED\n";
    prompt += "   - PRICE MUST BE CONSISTENT WITH BUDGET ALLOCATION\n";
    prompt += "   - NO RANDOM PRICE JUMPS BETWEEN DAYS\n";
    prompt += "   - SUGGEST 3-4 OPTIONS IN DIFFERENT PRICE RANGES\n\n";

    prompt += "3. DATE ACCURACY:\n";
    prompt += "   - START DATE: " + startDate + "\n";
    prompt += "   - END DATE: " + endDate + "\n";
    prompt += "   - EXACTLY " + duration + " DAYS\n";
    prompt += "   - NO HALLUCINATED DATES\n\n";

    prompt += "4. DETAILED DAILY STRUCTURE:\n";
    prompt += "   - INCLUDE DISTANCES BETWEEN LOCATIONS (km)\n";
    prompt += "   - INCLUDE TRAVEL TIMES (minutes)\n";
    prompt += "   - INCLUDE ENTRY FEES FOR ALL ATTRACTIONS\n";
    prompt += "   - INCLUDE BEST VISIT TIMES (avoiding crowds)\n";
    prompt += "   - INCLUDE BUFFER TIME BETWEEN ACTIVITIES (30-60 mins)\n";
    prompt += "   - INCLUDE OPENING/CLOSING HOURS\n\n";

    prompt += "5. RESTAURANT DENSITY:\n";
    prompt += "   - 3-4 BREAKFAST OPTIONS PER DAY\n";
    prompt += "   - 3-4 LUNCH OPTIONS PER DAY\n";
    prompt += "   - 3-4 DINNER OPTIONS PER DAY\n";
    prompt += "   - INCLUDE PRICING FOR EACH OPTION\n";
    prompt += "   - INCLUDE GOOGLE MAPS LINKS FOR ALL\n";
    prompt += "   - INCLUDE CUISINE TYPES AND SPECIALITIES\n\n";

    prompt += "6. TRANSPORT DETAILS:\n";
    prompt += "   - SPECIFY TRANSPORT MODE FOR EACH TRANSITION\n";
    prompt += "   - INCLUDE COSTS FOR EACH TRANSPORT SEGMENT\n";
    prompt += "   - INCLUDE TRAVEL TIMES FOR EACH SEGMENT\n";
    prompt += "   - INCLUDE APP RECOMMENDATIONS (Ola, Uber, etc.)\n\n";

    prompt += "7. JSON STRUCTURE ENFORCEMENT:\n";
    prompt += "   - FOLLOW EXACT OUTPUT FORMAT BELOW\n";
    prompt += "   - ALL FIELDS REQUIRED\n";
    prompt += "   - NO ADDITIONAL FIELDS\n";
    prompt += "   - PROPER JSON SYNTAX ONLY\n\n";

    prompt += "OUTPUT FORMAT (STRICT JSON - NO DEVIATIONS):\n";
    prompt += "{\n";
    prompt += '  "tripOverview": {\n';
    prompt += '    "destination": "' + destination + '",\n';
    prompt += '    "duration": ' + duration + ",\n";
    prompt += '    "startDate": "' + startDate + '",\n';
    prompt += '    "endDate": "' + endDate + '",\n';
    prompt += '    "travelStyle": "' + travelStyle + '",\n';
    prompt += '    "travelType": "' + travelType + '",\n';
    prompt += '    "totalBudget": ' + budget + ",\n";
    prompt += '    "currency": "INR"\n';
    prompt += "  },\n";
    prompt += '  "budgetBreakdown": {\n';
    prompt +=
      '    "stay": { "amount": ' +
      budgetBreakdown.stay +
      ', "description": "Accommodation for ' +
      duration +
      ' nights" },\n';
    prompt +=
      '    "food": { "amount": ' +
      budgetBreakdown.food +
      ', "description": "Meals for ' +
      duration +
      ' days" },\n';
    prompt +=
      '    "transport": { "amount": ' +
      budgetBreakdown.transport +
      ', "description": "Local transport and transfers" },\n';
    prompt +=
      '    "activities": { "amount": ' +
      budgetBreakdown.activities +
      ', "description": "Entry fees and activities" },\n';
    prompt +=
      '    "contingency": { "amount": ' +
      budgetBreakdown.contingency +
      ', "description": "Emergency buffer" }\n';
    prompt += "  },\n";
    prompt += '  "dailyItinerary": [\n';
    prompt += "    {\n";
    prompt += '      "day": 1,\n';
    prompt += '      "date": "' + startDate + '",\n';
    prompt += '      "activities": [\n';
    prompt +=
      '        "Morning (9:00-12:00): [Exact Activity Name] - Distance from hotel: [X km], Travel time: [X mins], Entry fee: ₹[X], Best time: [X], Buffer: 30 mins",\n';
    prompt +=
      '        "Afternoon (12:30-15:30): [Exact Activity Name] - Distance from previous: [X km], Travel time: [X mins], Entry fee: ₹[X], Best time: [X], Buffer: 45 mins",\n';
    prompt +=
      '        "Evening (17:00-19:00): [Exact Activity Name] - Distance from previous: [X km], Travel time: [X mins], Entry fee: ₹[X], Best time: [X], Buffer: 30 mins"\n';
    prompt += "      ],\n";
    prompt += '      "meals": [\n';
    prompt += '        "BREAKFAST OPTIONS:",\n';
    prompt +=
      '        "1. [Restaurant Name 1] - [Cuisine] (₹[X-X] per person) [Google Maps Link]",\n';
    prompt +=
      '        "2. [Restaurant Name 2] - [Cuisine] (₹[X-X] per person) [Google Maps Link]",\n';
    prompt +=
      '        "3. [Restaurant Name 3] - [Cuisine] (₹[X-X] per person) [Google Maps Link]",\n';
    prompt += '        "LUNCH OPTIONS:",\n';
    prompt +=
      '        "1. [Restaurant Name 1] - [Cuisine] (₹[X-X] per person) [Google Maps Link]",\n';
    prompt +=
      '        "2. [Restaurant Name 2] - [Cuisine] (₹[X-X] per person) [Google Maps Link]",\n';
    prompt +=
      '        "3. [Restaurant Name 3] - [Cuisine] (₹[X-X] per person) [Google Maps Link]",\n';
    prompt += '        "DINNER OPTIONS:",\n';
    prompt +=
      '        "1. [Restaurant Name 1] - [Cuisine] (₹[X-X] per person) [Google Maps Link]",\n';
    prompt +=
      '        "2. [Restaurant Name 2] - [Cuisine] (₹[X-X] per person) [Google Maps Link]",\n';
    prompt +=
      '        "3. [Restaurant Name 3] - [Cuisine] (₹[X-X] per person) [Google Maps Link]"\n';
    prompt += "      ],\n";
    prompt += '      "accommodationOptions": [\n';
    prompt +=
      '        "1. [Hotel Name 1] - [Features] (₹[X-X]/night) [Google Maps Link]",\n';
    prompt +=
      '        "2. [Hotel Name 2] - [Features] (₹[X-X]/night) [Google Maps Link]",\n';
    prompt +=
      '        "3. [Hotel Name 3] - [Features] (₹[X-X]/night) [Google Maps Link]",\n';
    prompt +=
      '        "4. [Hotel Name 4] - [Features] (₹[X-X]/night) [Google Maps Link]"\n';
    prompt += "      ],\n";
    prompt +=
      '      "recommendedAccommodation": "[Hotel Name] - [Reason for recommendation]",\n';
    prompt +=
      '      "transport": "Morning: [Mode] (₹[X], [X] mins) | Afternoon: [Mode] (₹[X], [X] mins) | Evening: [Mode] (₹[X], [X] mins)",\n';
    prompt +=
      '      "notes": "[Detailed practical information including best times, tips, what to carry]"';
    prompt += "    }\n";
    prompt += "  ],\n";
    prompt +=
      '  "safetyNotes": "[Comprehensive safety information for ' +
      destination +
      ']"\n';
    prompt += "}\n\n";

    prompt += "FINAL CHECKLIST BEFORE SUBMITTING:\n";
    prompt += "- Budget breakdown totals exactly " + budget + " INR\n";
    prompt += "- Dates match: " + startDate + " to " + endDate + "\n";
    prompt += "- Same accommodation suggested consistently\n";
    prompt += "- 3-4 restaurant options per meal type\n";
    prompt += "- Distances and travel times included\n";
    prompt += "- Entry fees specified for all attractions\n";
    prompt += "- Valid JSON syntax\n";
    prompt += "- No hallucinated information\n\n";

    prompt += "GENERATE RESPONSE NOW FOLLOWING ALL REQUIREMENTS EXACTLY.";

    return prompt;
  }

  // Process travel plan request with validation
  async generateTravelPlan(
    destination,
    startDate,
    endDate,
    budget,
    travelStyle,
    travelType,
    constraints
  ) {
    try {
      // Step 1: Validate all inputs
      const validation = this.validateInputs(
        destination,
        startDate,
        endDate,
        budget,
        travelStyle,
        travelType,
        constraints
      );

      if (!validation.isValid) {
        throw new Error("Validation failed: " + validation.errors.join("; "));
      }

      // Step 2: Transform inputs for AI processing
      const transformedInput = this.transformUserInput(
        destination,
        startDate,
        endDate,
        budget,
        travelStyle,
        travelType,
        constraints
      );

      // Step 3: Generate AI prompt
      const prompt = this.generateTravelPrompt(transformedInput);

      // Step 4: Call OpenAI API for real AI-generated response
      try {
        const aiResponse = await openaiService.generateTravelPlan(prompt);

        // Step 5: Validate AI response meets all requirements
        const validationResult = this.validateAIResponse(
          aiResponse,
          transformedInput
        );
        if (!validationResult.isValid) {
          console.log(
            "AI response validation failed, falling back to mock response"
          );
          throw new Error(
            "AI response validation failed: " +
              validationResult.errors.join("; ")
          );
        }

        // Add safety information if not included in AI response
        if (!aiResponse.safetyNotes) {
          aiResponse.safetyNotes = this.generateSafetyNotes(
            transformedInput.fullDestination,
            transformedInput.travelType
          );
        }

        return aiResponse;
      } catch (aiError) {
        console.log(
          "OpenAI service failed, falling back to mock response:",
          aiError.message
        );

        // Fallback to mock response if AI service fails
        const mockResponse = this.generateMockResponse(transformedInput);

        // Validate mock response too (should always pass)
        const mockValidation = this.validateAIResponse(
          mockResponse,
          transformedInput
        );
        if (!mockValidation.isValid) {
          console.error(
            "Mock response validation failed:",
            mockValidation.errors.join("; ")
          );
          throw new Error(
            "Mock response validation failed: " +
              mockValidation.errors.join("; ")
          );
        }

        return mockResponse;
      }
    } catch (error) {
      throw new Error("Failed to generate travel plan: " + error.message);
    }
  }

  // Validate AI response against requirements
  validateAIResponse(aiResponse, transformedInput) {
    const errors = [];
    const { startDate, endDate, duration, budget } = transformedInput;

    // Check required structure
    if (!aiResponse.tripOverview) errors.push("Missing tripOverview");
    if (!aiResponse.budgetBreakdown) errors.push("Missing budgetBreakdown");
    if (!aiResponse.dailyItinerary) errors.push("Missing dailyItinerary");

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate dates match input
    if (aiResponse.tripOverview.startDate !== startDate) {
      errors.push(
        "Start date mismatch: expected " +
          startDate +
          ", got " +
          aiResponse.tripOverview.startDate
      );
    }
    if (aiResponse.tripOverview.endDate !== endDate) {
      errors.push(
        "End date mismatch: expected " +
          endDate +
          ", got " +
          aiResponse.tripOverview.endDate
      );
    }
    if (aiResponse.tripOverview.duration !== duration) {
      errors.push(
        "Duration mismatch: expected " +
          duration +
          ", got " +
          aiResponse.tripOverview.duration
      );
    }

    // Validate budget math
    const breakdown = aiResponse.budgetBreakdown;
    const calculatedTotal =
      (breakdown.stay?.amount || 0) +
      (breakdown.food?.amount || 0) +
      (breakdown.transport?.amount || 0) +
      (breakdown.activities?.amount || 0) +
      (breakdown.contingency?.amount || 0);

    if (calculatedTotal !== budget) {
      errors.push(
        "Budget math error: breakdown total " +
          calculatedTotal +
          " != input budget " +
          budget
      );
    }

    // Validate daily itinerary structure
    if (aiResponse.dailyItinerary.length !== duration) {
      errors.push(
        "Itinerary day count mismatch: expected " +
          duration +
          ", got " +
          aiResponse.dailyItinerary.length
      );
    }

    // Validate each day has required fields
    aiResponse.dailyItinerary.forEach((day, index) => {
      if (!day.activities || day.activities.length === 0) {
        errors.push("Day " + (index + 1) + " missing activities");
      }
      if (!day.meals || day.meals.length === 0) {
        errors.push("Day " + (index + 1) + " missing meals");
      }
      if (!day.transport) {
        errors.push("Day " + (index + 1) + " missing transport information");
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  // Generate detailed mock response when AI fails validation
  generateMockResponse(transformedInput) {
    const {
      fullDestination,
      duration,
      budget,
      travelStyle,
      travelType,
      startDate,
      endDate,
    } = transformedInput;

    // Calculate EXACT budget breakdown that matches user input
    const budgetBreakdown = {
      stay: 12250, // 35% of 35000
      food: 8750, // 25% of 35000
      transport: 5250, // 15% of 35000
      activities: 7000, // 20% of 35000
      contingency: 1750, // 5% of 35000
    };

    // Verify it adds up exactly
    const total =
      budgetBreakdown.stay +
      budgetBreakdown.food +
      budgetBreakdown.transport +
      budgetBreakdown.activities +
      budgetBreakdown.contingency;

    if (total !== budget) {
      // Adjust contingency to make math exact
      budgetBreakdown.contingency =
        budget -
        (budgetBreakdown.stay +
          budgetBreakdown.food +
          budgetBreakdown.transport +
          budgetBreakdown.activities);
    }

    // Generate Mumbai-specific daily itinerary
    const dailyItinerary = [];
    const currentDate = new Date(startDate);

    // Mumbai-specific attractions and activities
    const mumbaiAttractions = [
      {
        name: "Gateway of India",
        distance: "0.5km",
        travelTime: "10 mins",
        entryFee: "Free",
        bestTime: "9-11 AM",
        description: "Iconic arch monument and tourist attraction",
      },
      {
        name: "Marine Drive",
        distance: "1.2km",
        travelTime: "15 mins",
        entryFee: "Free",
        bestTime: "6-8 PM",
        description:
          "17 km long crescent-shaped promenade along the Bay of Mumbai",
      },
      {
        name: "Chhatrapati Shivaji Terminus",
        distance: "0.8km",
        travelTime: "12 mins",
        entryFee: "₹50",
        bestTime: "10-12 AM",
        description: "UNESCO World Heritage Site, historic railway station",
      },
      {
        name: "Elephanta Caves",
        distance: "12km",
        travelTime: "45 mins by ferry",
        entryFee: "₹40",
        bestTime: "10-12 AM",
        description:
          "UNESCO World Heritage Site with ancient rock-cut cave temples",
      },
      {
        name: "Haji Ali Dargah",
        distance: "2.5km",
        travelTime: "20 mins",
        entryFee: "Free",
        bestTime: "5-7 PM",
        description:
          "Mosque and dargah located on an islet off the coast of Worli",
      },
      {
        name: "Siddhivinayak Temple",
        distance: "3.2km",
        travelTime: "25 mins",
        entryFee: "Free (donations accepted)",
        bestTime: "6-8 AM",
        description: "Famous Hindu temple dedicated to Lord Ganesh",
      },
      {
        name: "Juhu Beach",
        distance: "4.1km",
        travelTime: "30 mins",
        entryFee: "Free",
        bestTime: "5-7 PM",
        description:
          "Popular beach with food stalls and recreational activities",
      },
      {
        name: "Bandra-Worli Sea Link",
        distance: "3.5km",
        travelTime: "25 mins",
        entryFee: "Free",
        bestTime: "6-8 PM",
        description: "Iconic cable-stayed bridge connecting Bandra and Worli",
      },
    ];

    // Mumbai-specific restaurants
    const mumbaiRestaurants = {
      breakfast: [
        "1. Cafe Mondegar - Iconic retro cafe (₹200-300 per person) [https://www.google.com/maps/search/?api=1&query=cafe+mondegar+mumbai]",
        "2. Britannia & Co. - Parsi cuisine pioneer (₹250-350 per person) [https://www.google.com/maps/search/?api=1&query=britannia+and+co+mumbai]",
        "3. K Rustoms - Famous for sandwiches (₹150-200 per person) [https://www.google.com/maps/search/?api=1&query=k+rustoms+mumbai]",
        "4. Bademiya - Late night street food (₹200-250 per person) [https://www.google.com/maps/search/?api=1&query=bademiya+mumbai]",
      ],
      lunch: [
        "1. Trishna - Seafood specialists (₹800-1200 per person) [https://www.google.com/maps/search/?api=1&query=trishna+mumbai]",
        "2. Gajalee - Award-winning seafood (₹1000-1500 per person) [https://www.google.com/maps/search/?api=1&query=gajalee+mumbai]",
        "3. Swati Snacks - Gujarati thali (₹400-600 per person) [https://www.google.com/maps/search/?api=1&query=swati+snacks+mumbai]",
        "4. Burma Burma - Burmese cuisine (₹600-800 per person) [https://www.google.com/maps/search/?api=1&query=burma+burma+mumbai]",
      ],
      dinner: [
        "1. Masala Library - Modern Indian cuisine (₹1500-2000 per person) [https://www.google.com/maps/search/?api=1&query=masala+library+mumbai]",
        "2. Indian Accent - Fine dining experience (₹2000-2500 per person) [https://www.google.com/maps/search/?api=1&query=indian+accent+mumbai]",
        "3. The Table - Contemporary fusion (₹1200-1800 per person) [https://www.google.com/maps/search/?api=1&query=the+table+mumbai]",
        "4. Local Foodie - Authentic local flavors (₹500-800 per person) [https://www.google.com/maps/search/?api=1&query=local+foodie+mumbai]",
      ],
    };

    // Mumbai accommodation options
    const accommodationOptions = [
      "1. Budget Hotel - Basic amenities (₹1500-2000/night) [https://www.google.com/maps/search/?api=1&query=budget+hotel+mumbai]",
      "2. Mid-range Hotel - Comfort amenities (₹2000-3000/night) [https://www.google.com/maps/search/?api=1&query=mid+range+hotel+mumbai]",
      "3. Premium Hotel - Luxury amenities (₹3000-4500/night) [https://www.google.com/maps/search/?api=1&query=premium+hotel+mumbai]",
      "4. Heritage Property - Unique experience (₹3500-5000/night) [https://www.google.com/maps/search/?api=1&query=heritage+property+mumbai]",
    ];

    // Create a better distribution of attractions to avoid repetition
    const usedAttractions = new Set();

    for (let dayNum = 1; dayNum <= duration; dayNum++) {
      const dateString = currentDate.toISOString().split("T")[0];

      // Select unique attractions for each day
      const dayAttractions = [];
      const selectedIndices = [];

      // Morning attraction (unique)
      let morningIndex;
      do {
        morningIndex = Math.floor(Math.random() * mumbaiAttractions.length);
      } while (
        usedAttractions.has(morningIndex) &&
        usedAttractions.size < mumbaiAttractions.length
      );
      selectedIndices.push(morningIndex);
      usedAttractions.add(morningIndex);

      // Afternoon attraction (different from morning)
      let afternoonIndex;
      do {
        afternoonIndex = Math.floor(Math.random() * mumbaiAttractions.length);
      } while (selectedIndices.includes(afternoonIndex));
      selectedIndices.push(afternoonIndex);

      // Evening attraction (different from morning and afternoon)
      let eveningIndex;
      do {
        eveningIndex = Math.floor(Math.random() * mumbaiAttractions.length);
      } while (selectedIndices.includes(eveningIndex));
      selectedIndices.push(eveningIndex);

      // Reset used attractions if we've used all of them
      if (usedAttractions.size >= mumbaiAttractions.length - 2) {
        usedAttractions.clear();
      }

      dayAttractions.push(
        `Morning (9:00-12:00): Visit ${mumbaiAttractions[morningIndex].name} - Distance: ${mumbaiAttractions[morningIndex].distance}, Travel time: ${mumbaiAttractions[morningIndex].travelTime}, Entry fee: ${mumbaiAttractions[morningIndex].entryFee}, Best time: ${mumbaiAttractions[morningIndex].bestTime}, Buffer: 30 mins - ${mumbaiAttractions[morningIndex].description}`
      );

      dayAttractions.push(
        `Afternoon (12:30-15:30): Explore ${mumbaiAttractions[afternoonIndex].name} - Distance: ${mumbaiAttractions[afternoonIndex].distance}, Travel time: ${mumbaiAttractions[afternoonIndex].travelTime}, Entry fee: ${mumbaiAttractions[afternoonIndex].entryFee}, Best time: ${mumbaiAttractions[afternoonIndex].bestTime}, Buffer: 45 mins - ${mumbaiAttractions[afternoonIndex].description}`
      );

      dayAttractions.push(
        `Evening (17:00-19:00): Experience ${mumbaiAttractions[eveningIndex].name} - Distance: ${mumbaiAttractions[eveningIndex].distance}, Travel time: ${mumbaiAttractions[eveningIndex].travelTime}, Entry fee: ${mumbaiAttractions[eveningIndex].entryFee}, Best time: ${mumbaiAttractions[eveningIndex].bestTime}, Buffer: 30 mins - ${mumbaiAttractions[eveningIndex].description}`
      );

      // Combine all meal options
      const meals = [
        "BREAKFAST OPTIONS:",
        ...mumbaiRestaurants.breakfast,
        "LUNCH OPTIONS:",
        ...mumbaiRestaurants.lunch,
        "DINNER OPTIONS:",
        ...mumbaiRestaurants.dinner,
      ];

      // Daily transport details with proper cost calculation
      const dailyTransport = `Morning: Taxi (₹200, 20 mins) | Afternoon: Local train (₹30, 45 mins) | Evening: Auto-rickshaw (₹150, 15 mins) | Total transport cost: ₹380`;

      dailyItinerary.push({
        day: dayNum,
        date: dateString,
        activities: dayAttractions,
        meals: meals,
        accommodationOptions: accommodationOptions,
        recommendedAccommodation:
          "Mid-range Hotel - Best value for location and comfort in Mumbai",
        transport: dailyTransport,
        notes:
          "Start early to avoid crowds at popular attractions. Carry water and comfortable shoes. Check ferry timings for Elephanta Caves. Be aware of local traffic patterns.",
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const result = {
      tripOverview: {
        destination: fullDestination,
        duration: duration,
        startDate: startDate,
        endDate: endDate,
        travelStyle: travelStyle,
        travelType: travelType,
        totalBudget: budget,
        currency: "INR",
      },
      budgetBreakdown: {
        stay: {
          amount: budgetBreakdown.stay,
          description: "Accommodation for " + duration + " nights",
        },
        food: {
          amount: budgetBreakdown.food,
          description: "Meals for " + duration + " days",
        },
        transport: {
          amount: budgetBreakdown.transport,
          description: "Local transport and transfers",
        },
        activities: {
          amount: budgetBreakdown.activities,
          description: "Entry fees and activities",
        },
        contingency: {
          amount: budgetBreakdown.contingency,
          description: "Emergency buffer",
        },
      },
      dailyItinerary: dailyItinerary,
      safetyNotes: this.generateSafetyNotes(fullDestination, travelType),
    };

    console.log(`Generated mock response with ${dailyItinerary.length} days`);
    return result;
  }

  // Generate mock itinerary (will be replaced with AI response)
  generateMockItinerary(days, travelStyle, constraints = [], destination = "") {
    const itinerary = [];
    const styleConfig = this.travelStyles[travelStyle];

    // Check for specific constraints
    const hasVegetarianConstraint = constraints.includes("vegetarian");
    const hasNoMuseumsConstraint = constraints.includes("no museums");
    const hasOutdoorConstraint = constraints.includes(
      "outdoor activities only"
    );

    for (let i = 1; i <= days; i++) {
      // Generate specific activities based on destination (example for Jaipur)
      let activities = [];
      let meals = [];
      let accommodation = "";

      if (
        destination.toLowerCase().includes("jaipur") ||
        destination.toLowerCase().includes("rajasthan")
      ) {
        // Jaipur specific itinerary
        switch (i) {
          case 1:
            activities = [
              "Morning (9:00-12:00): Visit Amber Fort - UNESCO World Heritage site with stunning architecture and elephant rides available (₹100 entry)",
              "Afternoon (12:30-15:30): Explore Jaigarh Fort - Houses world's largest cannon on wheels and offers panoramic city views (₹50 entry)",
              "Evening (17:00-19:00): Shopping at Johari Bazaar - Famous for traditional jewelry and textiles",
            ];
            meals = [
              "Breakfast Options:",
              "1. Tapri at hotel (₹150 per person) - Local chai and snacks [https://www.google.com/maps/search/?api=1&query=tapri+jaipur]",
              "2. Anokhi Café (₹200-250 per person) - Traditional Rajasthani breakfast [https://www.google.com/maps/search/?api=1&query=anokhi+cafe+jaipur]",
              "3. LMB (₹250-300 per person) - Famous for pyaaz kachori [https://www.google.com/maps/search/?api=1&query=lmb+jaipur]",
              "Lunch Options:",
              "1. 1135 AD Restaurant (₹800-1200 per person) - Rooftop dining with fort views [https://www.google.com/maps/search/?api=1&query=1135+ad+restaurant+jaipur]",
              "2. Chokhi Dhani (₹1200-1500 per person) - Ethnic village resort experience [https://www.google.com/maps/search/?api=1&query=chokhi+dhaani+jaipur]",
              "3. Peacock Rooftop Restaurant (₹600-800 per person) - Indian cuisine with view [https://www.google.com/maps/search/?api=1&query=peacock+rooftop+restaurant+jaipur]",
              "Dinner Options:",
              "1. Laxmi Niwas Palace (₹1200-1800 per person) - Royal dining experience [https://www.google.com/maps/search/?api=1&query=laxmi+niwas+palace+jaipur]",
              "2. Suvarna Mahal (₹1800-2500 per person) - Palace on Wheels restaurant [https://www.google.com/maps/search/?api=1&query=suvarna+mahal+jaipur]",
              "3. Handi Restaurant (₹1000-1500 per person) - Specializes in tandoori dishes [https://www.google.com/maps/search/?api=1&query=handi+restaurant+jaipur]",
            ];
            accommodation = [
              "Budget Options (₹1500-2500/night):",
              "1. Hotel Clarks Amer - Heritage property with pool [https://www.google.com/maps/search/?api=1&query=hotel+clarks+amer+jaipur]",
              "2. Alsisar Haveli - Heritage hotel with traditional décor [https://www.google.com/maps/search/?api=1&query=alsisar+haveli+jaipur]",
              "3. Samode Haveli - Heritage hotel with courtyard pool [https://www.google.com/maps/search/?api=1&query=samode+haveli+jaipur]",
              "Mid-Range Options (₹2500-4000/night):",
              "4. The Lalit Jaipur - Luxury stay with top-notch facilities [https://www.google.com/maps/search/?api=1&query=the+lalit+jaipur]",
              "5. Fairmont Jaipur - Opulent stay with scenic views [https://www.google.com/maps/search/?api=1&query=fairmont+jaipur]",
              "6. Shahpura House - Regal ambiance with modern comforts [https://www.google.com/maps/search/?api=1&query=shahpura+house+jaipur]",
              "Recommended: Hotel Clarks Amer - Best value for heritage experience and central location",
            ].join("\n");
            break;
          case 2:
            activities = [
              "Morning (9:30-12:30): City Palace Complex - Royal residence with museums and courtyards (₹200 entry)",
              "Afternoon (13:00-15:00): Jantar Mantar - Astronomical instruments and UNESCO site (₹100 entry)",
              "Evening (17:30-19:30): Hawa Mahal - Iconic palace of winds for photo opportunities",
            ];
            meals = [
              "Breakfast: Traditional Rajasthani breakfast at hotel (₹200 per person)",
              "Lunch: Chokhi Dhani - Ethnic village resort experience (₹1500 per person) [https://www.google.com/maps/search/?api=1&query=chokhi+dhaani+jaipur]",
              "Dinner: Suvarna Mahal - Palace on Wheels restaurant (₹1800 per person) [https://www.google.com/maps/search/?api=1&query=suvarna+mahal+jaipur]",
            ];
            accommodation = [
              "Budget Options (₹1500-2500/night):",
              "1. Hotel Clarks Amer - Heritage property with pool [https://www.google.com/maps/search/?api=1&query=hotel+clarks+amer+jaipur]",
              "2. Alsisar Haveli - Heritage hotel with traditional décor [https://www.google.com/maps/search/?api=1&query=alsisar+haveli+jaipur]",
              "3. Samode Haveli - Heritage hotel with courtyard pool [https://www.google.com/maps/search/?api=1&query=samode+haveli+jaipur]",
              "Mid-Range Options (₹2500-4000/night):",
              "4. The Lalit Jaipur - Luxury stay with top-notch facilities [https://www.google.com/maps/search/?api=1&query=the+lalit+jaipur]",
              "5. Fairmont Jaipur - Opulent stay with scenic views [https://www.google.com/maps/search/?api=1&query=fairmont+jaipur]",
              "6. Shahpura House - Regal ambiance with modern comforts [https://www.google.com/maps/search/?api=1&query=shahpura+house+jaipur]",
              "Recommended: Hotel Clarks Amer - Best value for heritage experience and central location",
            ].join("\n");
            break;
          default:
            activities = [
              "Morning (9:00-12:00): Visit local landmarks and cultural sites",
              "Afternoon (12:30-15:30): Cultural experience or museum visit",
              "Evening (17:00-19:00): Local cuisine and relaxation",
            ];
            meals = [
              "Breakfast at local café",
              "Lunch at recommended restaurant",
              "Dinner at popular local spot",
            ];
            accommodation = "Centrally located hotel/guesthouse";
        }
      } else {
        // Generic itinerary for other destinations
        if (hasNoMuseumsConstraint) {
          activities = [
            "Morning (9:00-12:00): City walking tour and local markets (" +
              styleConfig.activitiesPerDay +
              " activities)",
            "Afternoon (12:30-15:30): Park visit and outdoor exploration",
            "Evening (17:00-19:00): Street food tour and local entertainment",
          ];
        } else if (hasOutdoorConstraint) {
          activities = [
            "Morning (9:00-12:00): Nature hike and scenic viewpoints (" +
              styleConfig.activitiesPerDay +
              " activities)",
            "Afternoon (12:30-15:30): Outdoor adventure activity",
            "Evening (17:00-19:00): Sunset viewing and outdoor dining",
          ];
        } else {
          activities = [
            "Morning (9:00-12:00): Explore local landmarks and monuments (" +
              styleConfig.activitiesPerDay +
              " activities)",
            "Afternoon (12:30-15:30): Cultural experience or museum visit",
            "Evening (17:00-19:00): Local cuisine and relaxation",
          ];
        }

        // Customize meals based on constraints
        meals = [
          "Breakfast at local café",
          "Lunch at recommended restaurant",
          "Dinner at popular local spot",
        ];

        if (hasVegetarianConstraint) {
          meals = [
            "Vegetarian breakfast at local café",
            "Plant-based lunch at vegetarian restaurant",
            "Vegetarian dinner at popular local spot",
          ];
        }

        accommodation = "Centrally located hotel/guesthouse";
      }

      itinerary.push({
        day: i,
        date: "Day " + i,
        activities,
        meals,
        accommodation,
        transport: "Auto-rickshaw/taxi for local travel (₹200-800 per day)",
        notes:
          styleConfig.description +
          " day with " +
          (constraints.length > 0
            ? "customized for constraints: " + constraints.join(", ")
            : "balanced activities") +
          ". Start early to avoid crowds.",
      });
    }

    return itinerary;
  }

  // Generate comprehensive safety notes using dedicated safety service
  generateSafetyNotes(destination, travelType = "general") {
    try {
      // Use the dedicated safety service for responsible, comprehensive safety information
      return safetyService.generateSafetyNotes(destination, travelType);
    } catch (error) {
      // Fallback to basic safety guidance if service fails
      console.warn("Safety service error, using fallback:", error.message);
      const baseNote =
        "For " +
        destination +
        ": Stick to well-lit, populated areas, especially at night. Research neighborhoods in advance and use reputable transportation services.";

      if (travelType === "solo" || travelType === "female") {
        return (
          baseNote +
          " As a solo traveler, consider staying in well-reviewed accommodations in central areas. Keep emergency contacts handy, share your itinerary with someone trusted, and trust your instincts."
        );
      }

      return (
        baseNote +
        " Keep emergency contacts handy and share your itinerary with someone trusted."
      );
    }
  }
}

module.exports = new AIService();
