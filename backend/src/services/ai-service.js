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

    // Constraint validation (case-insensitive)
    if (constraints && Array.isArray(constraints)) {
      const invalidConstraints = constraints.filter(
        (c) => !this.validConstraints.includes(c.toLowerCase())
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

  // Transform user input for consistent processing
  transformUserInput(
    destination,
    startDate,
    endDate,
    budget,
    travelStyle,
    travelType,
    constraints
  ) {
    // Normalize destination
    const normalizedDestination = destination
      .trim()
      .split(",")[0]
      .toLowerCase();

    // Parse dates
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

  // Calculate trip duration
  calculateTripDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
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

    // Calculate budget breakdown percentages
    const budgetBreakdown = {
      stay: Math.round(budget * 0.35),
      food: Math.round(budget * 0.25),
      transport: Math.round(budget * 0.15),
      activities: Math.round(budget * 0.2),
      contingency: Math.round(budget * 0.05),
    };

    // Ensure total matches exactly
    const totalCalculated =
      budgetBreakdown.stay +
      budgetBreakdown.food +
      budgetBreakdown.transport +
      budgetBreakdown.activities +
      budgetBreakdown.contingency;

    if (totalCalculated !== budget) {
      budgetBreakdown.contingency += budget - totalCalculated;
    }

    // Format constraints
    let constraintText = "";
    if (constraints && constraints.length > 0) {
      constraintText = "CONSTRAINTS: " + constraints.join(", ") + "\n";
    }

    // Build a more flexible and encouraging prompt
    let prompt = "";
    prompt +=
      "You are an expert AI Travel Planning Assistant. Create a realistic, helpful travel plan for the user.\n\n";
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
    prompt += "\nIMPORTANT GUIDELINES:\n\n";

    prompt += "1. Budget Distribution (approximate):\n";
    prompt += "   - Accommodation: ~" + budgetBreakdown.stay + " INR (35%)\n";
    prompt += "   - Food: ~" + budgetBreakdown.food + " INR (25%)\n";
    prompt += "   - Transport: ~" + budgetBreakdown.transport + " INR (15%)\n";
    prompt +=
      "   - Activities: ~" + budgetBreakdown.activities + " INR (20%)\n";
    prompt +=
      "   - Contingency: ~" + budgetBreakdown.contingency + " INR (5%)\n";
    prompt += "   - Total should be close to " + budget + " INR\n\n";

    prompt += "2. Accommodation:\n";
    prompt += "   - Suggest 3-4 options in different price ranges\n";
    prompt += "   - Include Google Maps links for each\n";
    prompt += "   - Recommend one based on value and location\n\n";

    prompt += "3. Daily Itinerary Structure:\n";
    prompt +=
      "   - " +
      styleConfig.activitiesPerDay +
      " activities per day (based on travel style)\n";
    prompt += "   - Include morning, afternoon, and evening activities\n";
    prompt +=
      "   - Add practical details like timing and distances when possible\n\n";

    prompt += "4. Dining Options:\n";
    prompt += "   - Provide 3-4 options for breakfast, lunch, and dinner\n";
    prompt += "   - Include price ranges and cuisine types\n";
    prompt += "   - Add Google Maps links\n\n";

    prompt += "5. Transportation:\n";
    prompt += "   - Specify main transport modes\n";
    prompt += "   - Include approximate costs\n";
    prompt += "   - Mention popular apps (Ola, Uber, etc.)\n\n";

    prompt += "OUTPUT FORMAT (JSON - be flexible with structure):\n";
    prompt += "{\n";
    prompt += '  "tripOverview": {\n';
    prompt += '    "destination": "' + destination + '",\n';
    prompt += '    "duration": ' + duration + ",\n";
    prompt += '    "startDate": "' + startDate + '",\n';
    prompt += '    "endDate": "' + endDate + '",\n';
    prompt += '    "travelStyle": "' + travelStyle + '",\n';
    prompt += '    "travelType": "' + travelType + '",\n';
    prompt += '    "totalBudget": ' + budget + "\n";
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
      ', "description": "Local transport" },\n';
    prompt +=
      '    "activities": { "amount": ' +
      budgetBreakdown.activities +
      ', "description": "Activities and entry fees" },\n';
    prompt +=
      '    "contingency": { "amount": ' +
      budgetBreakdown.contingency +
      ', "description": "Buffer for unexpected expenses" }\n';
    prompt += "  },\n";
    prompt += '  "dailyItinerary": [\n';
    prompt += "    {\n";
    prompt += '      "day": 1,\n';
    prompt += '      "date": "' + startDate + '",\n';
    prompt += '      "activities": [\n';
    prompt += '        "Morning: [Activity 1 with brief description]",\n';
    prompt += '        "Afternoon: [Activity 2 with brief description]",\n';
    prompt += '        "Evening: [Activity 3 with brief description]"\n';
    prompt += "      ],\n";
    prompt += '      "meals": [\n';
    prompt += '        "BREAKFAST OPTIONS:",\n';
    prompt +=
      '        "1. [Restaurant Name] - [Cuisine] (₹[price] per person) [Google Maps Link]",\n';
    prompt +=
      '        "2. [Restaurant Name] - [Cuisine] (₹[price] per person) [Google Maps Link]",\n';
    prompt += '        "LUNCH OPTIONS:",\n';
    prompt +=
      '        "1. [Restaurant Name] - [Cuisine] (₹[price] per person) [Google Maps Link]",\n';
    prompt += '        "DINNER OPTIONS:",\n';
    prompt +=
      '        "1. [Restaurant Name] - [Cuisine] (₹[price] per person) [Google Maps Link]"\n';
    prompt += "      ],\n";
    prompt += '      "accommodationOptions": [\n';
    prompt +=
      '        "1. [Hotel Name] - [Brief description] (₹[price]/night) [Google Maps Link]",\n';
    prompt +=
      '        "2. [Hotel Name] - [Brief description] (₹[price]/night) [Google Maps Link]"\n';
    prompt += "      ],\n";
    prompt +=
      '      "recommendedAccommodation": "[Hotel Name] - [Reason for recommendation]",\n';
    prompt +=
      '      "transport": "Main transport modes and approximate costs",\n';
    prompt += '      "notes": "[Helpful tips and practical information]"\n';
    prompt += "    }\n";
    prompt += "  ],\n";
    prompt +=
      '  "safetyNotes": "[Relevant safety information for ' +
      destination +
      ']"\n';
    prompt += "}\n\n";

    prompt +=
      "Please create a helpful, realistic travel plan that follows these guidelines. Focus on providing practical, useful information rather than perfect mathematical precision.";

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

        // Step 5: Validate AI response with more flexible criteria
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

  // More flexible validation for AI responses
  validateAIResponse(aiResponse, transformedInput) {
    const errors = [];
    const { startDate, endDate, duration, budget } = transformedInput;

    // Check required structure (more flexible)
    if (!aiResponse.tripOverview) errors.push("Missing tripOverview");
    if (!aiResponse.budgetBreakdown) errors.push("Missing budgetBreakdown");
    if (!aiResponse.dailyItinerary) errors.push("Missing dailyItinerary");

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate dates (allow some flexibility)
    if (aiResponse.tripOverview.startDate !== startDate) {
      // Only warn, don't reject
      console.log("Date warning: start date mismatch");
    }
    if (aiResponse.tripOverview.endDate !== endDate) {
      console.log("Date warning: end date mismatch");
    }

    // Validate duration with flexibility
    if (Math.abs(aiResponse.tripOverview.duration - duration) > 1) {
      errors.push(
        "Duration significantly mismatched: expected " +
          duration +
          ", got " +
          aiResponse.tripOverview.duration
      );
    }

    // Validate budget with more tolerance (±10%)
    const breakdown = aiResponse.budgetBreakdown;
    const calculatedTotal =
      (breakdown.stay?.amount || 0) +
      (breakdown.food?.amount || 0) +
      (breakdown.transport?.amount || 0) +
      (breakdown.activities?.amount || 0) +
      (breakdown.contingency?.amount || 0);

    const budgetDifference = Math.abs(calculatedTotal - budget);
    const tolerance = budget * 0.1; // 10% tolerance

    if (budgetDifference > tolerance) {
      errors.push(
        "Budget significantly off: breakdown total " +
          calculatedTotal +
          " vs input budget " +
          budget +
          " (difference: " +
          budgetDifference +
          ")"
      );
    }

    // Validate daily itinerary structure (more flexible)
    if (Math.abs(aiResponse.dailyItinerary.length - duration) > 1) {
      errors.push(
        "Itinerary day count significantly mismatched: expected " +
          duration +
          ", got " +
          aiResponse.dailyItinerary.length
      );
    }

    // Validate each day has basic content
    aiResponse.dailyItinerary.forEach((day, index) => {
      if (!day.activities || day.activities.length === 0) {
        console.log("Warning: Day " + (index + 1) + " has no activities");
      }
      if (!day.meals || day.meals.length === 0) {
        console.log("Warning: Day " + (index + 1) + " has no meals");
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
      stay: Math.round(budget * 0.35),
      food: Math.round(budget * 0.25),
      transport: Math.round(budget * 0.15),
      activities: Math.round(budget * 0.2),
      contingency: Math.round(budget * 0.05),
    };

    // Ensure total matches exactly
    const totalCalculated =
      budgetBreakdown.stay +
      budgetBreakdown.food +
      budgetBreakdown.transport +
      budgetBreakdown.activities +
      budgetBreakdown.contingency;

    if (totalCalculated !== budget) {
      budgetBreakdown.contingency += budget - totalCalculated;
    }

    // Generate daily itinerary
    const dailyItinerary = [];
    const styleConfig = this.travelStyles[travelStyle];

    // Create dates array
    const dates = [];
    const currentDate = new Date(startDate);
    for (let i = 0; i < duration; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate itinerary for each day
    for (let i = 0; i < duration; i++) {
      const dayNum = i + 1;
      const dateString = dates[i].toISOString().split("T")[0];

      // Generate activities based on travel style and destination
      const activities = [];
      const activityCount = styleConfig.activitiesPerDay;
      
      // Define destination-specific activities based on common attractions
      const destinationActivities = {
        jaipur: [
          "Visit Amber Fort - Historic hill fort with stunning architecture",
          "Explore City Palace - Royal residence with museum",
          "See Hawa Mahal - Iconic Palace of Winds",
          "Shop at Johari Bazaar - Famous jewelry market",
          "Visit Jantar Mantar - Astronomical observatory",
          "Explore Nahargarh Fort - Hill fort with panoramic views",
          "Visit Albert Hall Museum - Art and historical artifacts",
          "Explore Jal Mahal - Water palace in Man Sagar Lake"
        ],
        delhi: [
          "Visit Red Fort - Mughal era fort complex",
          "See India Gate - War memorial and national monument",
          "Explore Qutub Minar - UNESCO World Heritage site",
          "Visit Humayun's Tomb - Mughal architectural marvel",
          "Explore Lotus Temple - Baháʼí House of Worship",
          "Visit Rashtrapati Bhavan - Presidential residence",
          "Explore Chandni Chowk - Historic market area",
          "Visit Akshardham Temple - Hindu temple complex"
        ],
        mumbai: [
          "Visit Gateway of India - Historic monument",
          "Explore Marine Drive - Scenic waterfront boulevard",
          "See Elephanta Caves - UNESCO World Heritage rock-cut temples",
          "Visit Siddhivinayak Temple - Famous Ganesh temple",
          "Explore Bandra-Worli Sea Link - Cable-stayed bridge",
          "Visit Chhatrapati Shivaji Terminus - Railway station heritage",
          "Explore Juhu Beach - Popular beachfront",
          "Visit Film City - Bollywood film production hub"
        ],
        goa: [
          "Relax at Calangute Beach - Popular beach resort town",
          "Visit Basilica of Bom Jesus - UNESCO World Heritage church",
          "Explore Fort Aguada - Portuguese fort overlooking the sea",
          "See Dudhsagar Falls - Four-tiered waterfall",
          "Explore Old Goa - Former capital with historic churches",
          "Visit Anjuna Flea Market - Weekly market for handicrafts",
          "Explore Spice Plantations - Learn about local spices",
          "Visit Reis Magos Fort - Historic fort overlooking Mandovi River"
        ],
        default: [
          "Visit local historical landmarks and monuments",
          "Explore cultural centers and museums",
          "Discover local markets and shopping areas",
          "Experience natural attractions and parks",
          "Try local cuisine at authentic restaurants",
          "Visit scenic viewpoints and photography spots",
          "Participate in local cultural activities",
          "Explore local religious or spiritual sites"
        ]
      };
      
      const destKey = fullDestination.toLowerCase().split(',')[0].trim();
      const availableActivities = destinationActivities[destKey] || destinationActivities.default;
      
      for (let j = 0; j < activityCount; j++) {
        const timePeriods = ["Morning", "Afternoon", "Evening"];
        const period = timePeriods[j % 3] || timePeriods[0];
        const activityIndex = (i * activityCount + j) % availableActivities.length;
        activities.push(`${period}: ${availableActivities[activityIndex]}`);
      }

      // Detailed meal options based on destination
      const mealOptions = {
        jaipur: {
          breakfast: [
            "1. LMB - Local Rajasthani breakfast (₹300-400) [Google Maps Link]",
            "2. Handi Restaurant - Traditional thali (₹250-350) [Google Maps Link]",
            "3. Rawat Mishthan Bhandar - Famous for dal baati churma (₹200-300) [Google Maps Link]"
          ],
          lunch: [
            "1. Chokhi Dhani - Authentic Rajasthani thali (₹500-700) [Google Maps Link]",
            "2. Suvarna Mahal - Royal dining experience (₹700-900) [Google Maps Link]",
            "3. Jharokha - Traditional Rajasthani cuisine (₹400-600) [Google Maps Link]"
          ],
          dinner: [
            "1. 11th Cross - Fine dining with Rajasthani specialties (₹800-1200) [Google Maps Link]",
            "2. Bar Palladio - Italian with Indian fusion (₹600-800) [Google Maps Link]",
            "3. Moonlight Rooftop - Rooftop dining with city views (₹500-700) [Google Maps Link]"
          ]
        },
        delhi: {
          breakfast: [
            "1. Bengali Market - Street food favorites (₹150-250) [Google Maps Link]",
            "2. Indian Accent - Upscale breakfast (₹400-600) [Google Maps Link]",
            "3. The Great Indian Bagel Shop - Contemporary breakfast (₹250-350) [Google Maps Link]"
          ],
          lunch: [
            "1. Karim's - Historic Mughlai cuisine (₹400-600) [Google Maps Link]",
            "2. Indian Accent - Modern Indian cuisine (₹800-1000) [Google Maps Link]",
            "3. Al-Jawahar - Authentic Mughlai dishes (₹300-500) [Google Maps Link]"
          ],
          dinner: [
            "1. Bukhara - World-renowned North Indian cuisine (₹1200-1500) [Google Maps Link]",
            "2. Dum Pukht - Royal Mughlai cuisine (₹1000-1200) [Google Maps Link]",
            "3. Punjab Grill - Contemporary Indian (₹700-900) [Google Maps Link]"
          ]
        },
        mumbai: {
          breakfast: [
            "1. Britannia & Co. - Iranian cafe classics (₹200-300) [Google Maps Link]",
            "2. Kala Ghoda Cafe - Continental breakfast (₹300-400) [Google Maps Link]",
            "3. The Pantry - Modern cafe fare (₹250-350) [Google Maps Link]"
          ],
          lunch: [
            "1. Bademiya - Famous street-side eatery (₹150-250) [Google Maps Link]",
            "2. Trishna - Excellent seafood (₹600-800) [Google Maps Link]",
            "3. Swati Snacks - Vegetarian delicacies (₹200-300) [Google Maps Link]"
          ],
          dinner: [
            "1. Wasabi by Morimoto - Japanese cuisine (₹1500-2000) [Google Maps Link]",
            "2. Indigo Delicatessen - European inspired (₹600-800) [Google Maps Link]",
            "3. The Table - Fine dining experience (₹800-1200) [Google Maps Link]"
          ]
        },
        goa: {
          breakfast: [
            "1. Café Tato - Local Goan breakfast (₹150-250) [Google Maps Link]",
            "2. Martin's Corner - Portuguese influenced (₹200-300) [Google Maps Link]",
            "3. Mum's Kitchen - Homestyle Goan food (₹150-250) [Google Maps Link]"
          ],
          lunch: [
            "1. Fisherman's Wharf - Fresh seafood (₹400-600) [Google Maps Link]",
            "2. Britto's - Traditional Goan cuisine (₹300-500) [Google Maps Link]",
            "3. Ritz Classic - Seafood platters (₹500-700) [Google Maps Link]"
          ],
          dinner: [
            "1. The Fisherman's Table - Gourmet seafood (₹800-1200) [Google Maps Link]",
            "2. Mum's Kitchen - Authentic Goan dishes (₹400-600) [Google Maps Link]",
            "3. Ritz Classic - Portuguese-Goan fusion (₹600-800) [Google Maps Link]"
          ]
        },
        default: {
          breakfast: [
            "1. Local café - Regional breakfast specialties (₹150-250) [Google Maps Link]",
            "2. Hotel restaurant - Continental options (₹200-300) [Google Maps Link]",
            "3. Street food area - Authentic local flavors (₹100-200) [Google Maps Link]"
          ],
          lunch: [
            "1. Popular local restaurant (₹300-500) [Google Maps Link]",
            "2. Street food area - Authentic local cuisine (₹200-400) [Google Maps Link]",
            "3. Mid-range restaurant - Regional specialties (₹400-600) [Google Maps Link]"
          ],
          dinner: [
            "1. Fine dining restaurant (₹800-1200) [Google Maps Link]",
            "2. Local specialty restaurant (₹500-800) [Google Maps Link]",
            "3. Rooftop dining - With scenic views (₹600-900) [Google Maps Link]"
          ]
        }
      };
      
      const destKeyMeals = fullDestination.toLowerCase().split(',')[0].trim();
      const mealsData = mealOptions[destKeyMeals] || mealOptions.default;
      
      const meals = [
        "BREAKFAST OPTIONS:",
        ...mealsData.breakfast,
        "LUNCH OPTIONS:",
        ...mealsData.lunch,
        "DINNER OPTIONS:",
        ...mealsData.dinner
      ];

      // Detailed accommodation options based on destination
      const accommodationOptions = {
        jaipur: [
          "1. Rambagh Palace - Luxury heritage hotel (₹25000-35000/night) [Google Maps Link]",
          "2. Fairmont Jaipur - Palace resort (₹15000-20000/night) [Google Maps Link]",
          "3. ITC Rajputana - Luxury business hotel (₹8000-12000/night) [Google Maps Link]",
          "4. Hotel Pearl Palace - Mid-range heritage feel (₹3000-5000/night) [Google Maps Link]",
          "5. Zostel Jaipur - Budget backpacker hostel (₹800-1200/night) [Google Maps Link]"
        ],
        delhi: [
          "1. The Oberoi - Luxury business hotel (₹18000-25000/night) [Google Maps Link]",
          "2. The Leela Palace - Palace-style luxury (₹15000-20000/night) [Google Maps Link]",
          "3. The Ashok - Government-owned luxury (₹6000-9000/night) [Google Maps Link]",
          "4. Lemon Tree Hotel - Mid-range chain (₹4000-6000/night) [Google Maps Link]",
          "5. Hosteller Delhi - Budget hostel (₹600-1000/night) [Google Maps Link]"
        ],
        mumbai: [
          "1. The Taj Mahal Palace - Historic luxury hotel (₹15000-20000/night) [Google Maps Link]",
          "2. The Oberoi - Contemporary luxury (₹12000-18000/night) [Google Maps Link]",
          "3. Trident Nariman Point - Upscale business hotel (₹8000-12000/night) [Google Maps Link]",
          "4. The St. Regis Mumbai - Luxury chain hotel (₹10000-15000/night) [Google Maps Link]",
          "5. Backpackers Panda - Budget hostel (₹700-1200/night) [Google Maps Link]"
        ],
        goa: [
          "1. The Leela Goa - Beachfront luxury (₹15000-20000/night) [Google Maps Link]",
          "2. W Goa - Boutique luxury resort (₹12000-18000/night) [Google Maps Link]",
          "3. Park Hyatt Goa Resort - Golf course resort (₹10000-15000/night) [Google Maps Link]",
          "4. Lemon Tree Resort - Beach resort (₹5000-7000/night) [Google Maps Link]",
          "5. Zostel Goa - Beachside hostel (₹800-1500/night) [Google Maps Link]"
        ],
        default: [
          "1. Luxury Hotel - Premium experience (₹8000-15000/night) [Google Maps Link]",
          "2. Upscale Hotel - Good amenities (₹5000-8000/night) [Google Maps Link]",
          "3. Mid-range Hotel - Comfortable stay (₹2000-4000/night) [Google Maps Link]",
          "4. Budget Hotel - Basic but clean (₹800-1500/night) [Google Maps Link]",
          "5. Hostel/Guesthouse - Economy option (₹400-800/night) [Google Maps Link]"
        ]
      };
      
      const destKeyAccom = fullDestination.toLowerCase().split(',')[0].trim();
      const availableAccommodations = accommodationOptions[destKeyAccom] || accommodationOptions.default;
      
      const recommendedAccommodation = availableAccommodations[Math.floor(Math.random() * availableAccommodations.length)];
      
      const transportOptions = {
        jaipur: "Local transport: Auto-rickshaw, Metro, Ola/Uber, Tourist buses, Cycle rickshaw for old city",
        delhi: "Local transport: Metro, Auto-rickshaw, Ola/Uber, Delhi Transport buses, App-based cabs",
        mumbai: "Local transport: Local train, BEST buses, Auto-rickshaw, Ola/Uber, Mumbai Metro",
        goa: "Local transport: Taxi, Auto-rickshaw, Motorcycle rentals, GSRTC buses, App-based cabs",
        default: "Local transport: Auto-rickshaw, Ola/Uber, Local buses, Metro (if available), Cycle ricksaw"
      };
      
      const destTransport = transportOptions[destKeyAccom] || transportOptions.default;

      dailyItinerary.push({
        day: dayNum,
        date: dateString,
        activities: activities,
        meals: meals,
        accommodationOptions: availableAccommodations,
        recommendedAccommodation: recommendedAccommodation,
        transport: destTransport,
        notes:
          "Carry comfortable shoes, stay hydrated, and respect local customs. Check opening hours before visiting attractions.",
      });
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

  // Generate safety notes based on destination and travel type
  generateSafetyNotes(destination, travelType) {
    let safetyNotes = `Safety Information for ${destination}:\n\n`;

    safetyNotes += "General Safety Tips:\n";
    safetyNotes +=
      "- Stay aware of your surroundings, especially in crowded areas\n";
    safetyNotes +=
      "- Keep valuables secure and use hotel safes when available\n";
    safetyNotes += "- Carry photocopies of important documents\n";
    safetyNotes += "- Stay hydrated and use sunscreen\n\n";

    if (travelType === "female" || travelType === "solo") {
      safetyNotes += "Women's Safety Specific:\n";
      safetyNotes += "- Avoid walking alone at night in unfamiliar areas\n";
      safetyNotes += "- Dress modestly and respect local customs\n";
      safetyNotes += "- Trust your instincts and seek help if needed\n";
      safetyNotes += "- Share your itinerary with trusted contacts\n\n";
    }

    safetyNotes += "Emergency Contacts:\n";
    safetyNotes += "- Local Police: 100\n";
    safetyNotes += "- Tourist Helpline: 1363\n";
    safetyNotes += "- Emergency Services: 112\n";

    return safetyNotes;
  }

  // Generate only itinerary component
  async generateItinerary(destination, startDate, endDate, budget, travelStyle, travelType, constraints) {
    try {
      // Validate inputs first
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

      // Transform inputs for AI processing
      const transformedInput = this.transformUserInput(
        destination,
        startDate,
        endDate,
        budget,
        travelStyle,
        travelType,
        constraints
      );

      // Generate focused itinerary prompt
      const prompt = this.generateItineraryPrompt(transformedInput);
      
      try {
        const aiResponse = await openaiService.generateTravelPlan(prompt);
        
        // Validate and extract itinerary
        if (aiResponse && aiResponse.dailyItinerary) {
          return {
            dailyItinerary: aiResponse.dailyItinerary,
            tripOverview: aiResponse.tripOverview || transformedInput
          };
        } else {
          throw new Error("Invalid itinerary response from AI");
        }
      } catch (aiError) {
        console.log("AI itinerary generation failed, falling back to mock:", aiError.message);
        // Fallback to mock itinerary
        return this.generateMockItinerary(transformedInput);
      }
    } catch (error) {
      throw new Error("Failed to generate itinerary: " + error.message);
    }
  }

  // Generate only meal options component
  async generateMeals(destination, startDate, endDate, budget, travelStyle, travelType, constraints) {
    try {
      // Transform inputs
      const transformedInput = this.transformUserInput(
        destination,
        startDate,
        endDate,
        budget,
        travelStyle,
        travelType,
        constraints
      );

      // Generate focused meals prompt
      const prompt = this.generateMealsPrompt(transformedInput);
      
      try {
        const aiResponse = await openaiService.generateTravelPlan(prompt);
        
        // Validate and extract meals
        if (aiResponse && aiResponse.meals) {
          return {
            meals: aiResponse.meals,
            tripOverview: transformedInput
          };
        } else {
          throw new Error("Invalid meals response from AI");
        }
      } catch (aiError) {
        console.log("AI meals generation failed, falling back to mock:", aiError.message);
        // Fallback to mock meals
        return this.generateMockMeals(transformedInput);
      }
    } catch (error) {
      throw new Error("Failed to generate meals: " + error.message);
    }
  }

  // Generate only accommodation options component
  async generateAccommodation(destination, startDate, endDate, budget, travelStyle, travelType, constraints) {
    try {
      // Transform inputs
      const transformedInput = this.transformUserInput(
        destination,
        startDate,
        endDate,
        budget,
        travelStyle,
        travelType,
        constraints
      );

      // Generate focused accommodation prompt
      const prompt = this.generateAccommodationPrompt(transformedInput);
      
      try {
        const aiResponse = await openaiService.generateTravelPlan(prompt);
        
        // Validate and extract accommodation
        if (aiResponse && aiResponse.accommodation) {
          return {
            accommodation: aiResponse.accommodation,
            tripOverview: transformedInput
          };
        } else {
          throw new Error("Invalid accommodation response from AI");
        }
      } catch (aiError) {
        console.log("AI accommodation generation failed, falling back to mock:", aiError.message);
        // Fallback to mock accommodation
        return this.generateMockAccommodation(transformedInput);
      }
    } catch (error) {
      throw new Error("Failed to generate accommodation: " + error.message);
    }
  }

  // Generate only transport options component
  async generateTransport(destination, startDate, endDate, budget, travelStyle, travelType, constraints) {
    try {
      // Transform inputs
      const transformedInput = this.transformUserInput(
        destination,
        startDate,
        endDate,
        budget,
        travelStyle,
        travelType,
        constraints
      );

      // Generate focused transport prompt
      const prompt = this.generateTransportPrompt(transformedInput);
      
      try {
        const aiResponse = await openaiService.generateTravelPlan(prompt);
        
        // Validate and extract transport
        if (aiResponse && aiResponse.transport) {
          return {
            transport: aiResponse.transport,
            tripOverview: transformedInput
          };
        } else {
          throw new Error("Invalid transport response from AI");
        }
      } catch (aiError) {
        console.log("AI transport generation failed, falling back to mock:", aiError.message);
        // Fallback to mock transport
        return this.generateMockTransport(transformedInput);
      }
    } catch (error) {
      throw new Error("Failed to generate transport: " + error.message);
    }
  }

  // Generate focused prompts for each component
  generateItineraryPrompt(transformedInput) {
    const { fullDestination: destination, startDate, endDate, duration, budget, travelStyle, travelType, constraints } = transformedInput;
    
    return `
    Generate detailed daily itineraries for ${destination} from ${startDate} to ${endDate} (${duration} days) with ${travelStyle} travel style.
    
    Focus only on daily activities with:
    - Morning, afternoon, and evening activities for each day
    - Specific attractions, timing, and duration
    - Brief descriptions and estimated costs where applicable
    - Local transportation between activities if needed
    
    JSON format:
    {
      "dailyItinerary": [
        {
          "day": 1,
          "date": "${startDate}",
          "activities": [
            "Morning: [Activity name] - [Brief description and timing]",
            "Afternoon: [Activity name] - [Brief description and timing]",
            "Evening: [Activity name] - [Brief description and timing]"
          ]
        }
      ]
    }
    `;
  }

  generateMealsPrompt(transformedInput) {
    const { fullDestination: destination, startDate, endDate, duration, budget, travelStyle, travelType, constraints } = transformedInput;
    
    return `
    Generate detailed meal options for ${destination} for a ${duration}-day trip with budget of ${budget} INR.
    
    Provide 3-4 options for each meal type:
    - Breakfast options with local specialties
    - Lunch options with regional cuisine
    - Dinner options with fine dining and local restaurants
    - Include price ranges, cuisine types, and Google Maps links
    
    JSON format:
    {
      "meals": {
        "breakfast": [
          {
            "name": "[Restaurant Name]",
            "cuisine": "[Cuisine Type]",
            "priceRange": "₹[min]-[max] per person",
            "specialties": "[Key dishes]",
            "googleMapsLink": "[Working Google Maps URL]"
          }
        ],
        "lunch": [...],
        "dinner": [...]
      }
    }
    `;
  }

  generateAccommodationPrompt(transformedInput) {
    const { fullDestination: destination, startDate, endDate, duration, budget, travelStyle, travelType, constraints } = transformedInput;
    
    return `
    Generate accommodation options for ${destination} for ${duration} nights with budget of ${budget} INR.
    
    Provide 3-4 options across different price ranges:
    - Budget accommodations (hostels/guesthouses)
    - Mid-range hotels
    - Luxury hotels
    - Include price ranges, amenities, location benefits, and Google Maps links
    
    JSON format:
    {
      "accommodation": [
        {
          "name": "[Hotel/Guesthouse Name]",
          "category": "budget/mid-range/luxury",
          "priceRange": "₹[min]-[max] per night",
          "amenities": ["amenity1", "amenity2"],
          "location": "[Area/Neighborhood]",
          "googleMapsLink": "[Working Google Maps URL]"
        }
      ]
    }
    `;
  }

  generateTransportPrompt(transformedInput) {
    const { fullDestination: destination, startDate, endDate, duration, budget, travelStyle, travelType, constraints } = transformedInput;
    
    return `
    Generate transportation options for ${destination} for a ${duration}-day trip.
    
    Include:
    - Local transportation options (auto-rickshaw, metro, buses)
    - App-based services (Ola, Uber)
    - Airport/Station transfers if needed
    - Estimated costs and travel times
    - Tips for efficient travel
    
    JSON format:
    {
      "transport": {
        "localOptions": [
          {
            "mode": "[Transport mode]",
            "description": "[Brief description]",
            "costEstimate": "₹[amount] per trip",
            "availability": "[Availability info]"
          }
        ],
        "appServices": [...],
        "tips": ["tip1", "tip2"]
      }
    }
    `;
  }

  // Mock generators for fallback
  generateMockItinerary(transformedInput) {
    const { fullDestination, duration, startDate } = transformedInput;
    
    const dailyItinerary = [];
    const dates = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < duration; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    for (let i = 0; i < duration; i++) {
      const dayNum = i + 1;
      const dateString = dates[i].toISOString().split("T")[0];
      
      dailyItinerary.push({
        day: dayNum,
        date: dateString,
        activities: [
          `Morning: Explore ${fullDestination} landmarks - Visit major attractions and museums`,
          `Afternoon: Cultural experience - Local markets and historical sites`,
          `Evening: Relaxation time - Local restaurants and evening activities`
        ]
      });
    }
    
    return {
      dailyItinerary,
      tripOverview: transformedInput
    };
  }

  generateMockMeals(transformedInput) {
    const { fullDestination } = transformedInput;
    
    return {
      meals: {
        breakfast: [
          {
            name: `Local Café in ${fullDestination}`,
            cuisine: "Local/Continental",
            priceRange: "₹150-300 per person",
            specialties: "Regional breakfast items, coffee, tea",
            googleMapsLink: "https://maps.google.com/search?q=local+cafe+" + fullDestination
          }
        ],
        lunch: [
          {
            name: `Popular Restaurant in ${fullDestination}`,
            cuisine: "Regional cuisine",
            priceRange: "₹300-600 per person",
            specialties: "Local specialties, vegetarian options",
            googleMapsLink: "https://maps.google.com/search?q=restaurant+" + fullDestination
          }
        ],
        dinner: [
          {
            name: `Fine Dining in ${fullDestination}`,
            cuisine: "Multi-cuisine",
            priceRange: "₹800-1500 per person",
            specialties: "Signature dishes, ambiance dining",
            googleMapsLink: "https://maps.google.com/search?q=fine+dining+" + fullDestination
          }
        ]
      },
      tripOverview: transformedInput
    };
  }

  generateMockAccommodation(transformedInput) {
    const { fullDestination, budget } = transformedInput;
    
    return {
      accommodation: [
        {
          name: `Budget Hotel in ${fullDestination}`,
          category: "budget",
          priceRange: "₹800-1500 per night",
          amenities: ["Wi-Fi", "AC", "Breakfast"],
          location: "Central area",
          googleMapsLink: "https://maps.google.com/search?q=budget+hotel+" + fullDestination
        },
        {
          name: `Mid-range Hotel in ${fullDestination}`,
          category: "mid-range",
          priceRange: "₹2000-4000 per night",
          amenities: ["Wi-Fi", "AC", "Restaurant", "Swimming Pool"],
          location: "Business district",
          googleMapsLink: "https://maps.google.com/search?q=mid+range+hotel+" + fullDestination
        },
        {
          name: `Luxury Hotel in ${fullDestination}`,
          category: "luxury",
          priceRange: "₹5000-10000 per night",
          amenities: ["Wi-Fi", "AC", "Spa", "Restaurant", "Concierge"],
          location: "Prime location",
          googleMapsLink: "https://maps.google.com/search?q=luxury+hotel+" + fullDestination
        }
      ],
      tripOverview: transformedInput
    };
  }

  generateMockTransport(transformedInput) {
    const { fullDestination } = transformedInput;
    
    return {
      transport: {
        localOptions: [
          {
            mode: "Auto-rickshaw",
            description: "Most common local transport",
            costEstimate: "₹50-150 per trip",
            availability: "Available throughout the city"
          },
          {
            mode: "Local buses",
            description: "Economic public transport",
            costEstimate: "₹20-50 per trip",
            availability: "Extensive network coverage"
          }
        ],
        appServices: [
          {
            name: "Ola/Uber",
            description: "App-based taxi services",
            costEstimate: "₹100-300 per trip",
            availability: "Available in most areas"
          }
        ],
        tips: [
          "Book through apps for safety and fixed pricing",
          "Keep small change for auto-rickshaws",
          "Use metro where available for faster travel"
        ]
      },
      tripOverview: transformedInput
    };
  }

}

module.exports = new AIService();
