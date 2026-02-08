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
      stay: { percent: 35, description: "Mid-range hotels/guesthouses" },
      food: {
        percent: 25,
        description: "Mix of local restaurants and street food",
      },
      transport: { percent: 15, description: "Local transport and taxis" },
      activities: { percent: 20, description: "Entry fees and guided tours" },
      contingency: { percent: 5, description: "Emergency buffer" },
    };

    // Adjust based on travel style
    if (travelStyle === "chill") {
      budgetBreakdown.activities.percent = 15;
      budgetBreakdown.food.percent = 30;
      budgetBreakdown.stay.percent = 40;
    } else if (travelStyle === "fast-paced") {
      budgetBreakdown.activities.percent = 25;
      budgetBreakdown.transport.percent = 20;
      budgetBreakdown.food.percent = 20;
    }

    // Calculate specific budget amounts
    const stayBudget = Math.round(
      (budget * budgetBreakdown.stay.percent) / 100
    );
    const avgStayPerNight = Math.round(stayBudget / duration);

    // Build constraint string
    let constraintText = "";
    if (constraints && constraints.length > 0) {
      constraintText = `Additional constraints: ${constraints.join(", ")}. `;
    }

    // Build prompt with strict JSON enforcement
    let prompt = "";
    prompt +=
      "You are an expert AI Travel Planning Assistant.\n" +
      "Respond ONLY in valid JSON.\n" +
      "Do NOT include explanations, markdown, headings, or extra text outside JSON.\n" +
      "Do NOT repeat global sections like meals or accommodation outside the defined JSON structure.\n" +
      "Do NOT generate more than 1 meal option per meal type per day.\n\n";

    prompt += `Create a detailed travel plan for ${destination} from ${startDate} to ${endDate} (${duration} days) with a budget of ₹${budget} for ${travelType} travel in ${travelStyle} style.\n\n`;

    prompt += constraintText;

    prompt += `Budget allocation:\n`;
    Object.keys(budgetBreakdown).forEach((category) => {
      const allocation = budgetBreakdown[category];
      const amount = Math.round((budget * allocation.percent) / 100);
      prompt += `- ${category.toUpperCase()}: ₹${amount} (${
        allocation.percent
      }%) - ${allocation.description}\n`;
    });

    prompt += `\nCRITICAL RULES:\n`;
    prompt += `- Accommodation options MUST fit within the accommodation budget of ₹${stayBudget} for ${duration} nights (avg ₹${avgStayPerNight}/night).\n`;
    prompt += `- If budget is low (under ₹15,000 total), prioritize hostels or budget hotels (₹500-1500/night).\n`;
    prompt += `- If budget is moderate (₹15,000-30,000 total), suggest mid-range hotels (₹1500-4000/night).\n`;
    prompt += `- NEVER suggest luxury hotels if total trip budget < ₹40,000.\n`;
    prompt += `- NEVER suggest accommodation that costs more than 25% of total budget per night.\n`;
    prompt += `- For food, suggest options that match the local affordability (street food for budget trips, restaurants for higher budgets).\n`;
    prompt += `- Keep activity costs reasonable for the budget level (free/paid activities balanced accordingly).\n\n`;

    prompt += `QUALITY REQUIREMENTS:\n`;
    prompt += `- Each day must have exactly 3 activities (morning, afternoon, evening) based on ${styleConfig.pace} pace.\n`;
    prompt += `- Do NOT repeat the same activity across multiple days.\n`;
    prompt += `- Do NOT include generic notes like 'Enjoy your day', 'Relax and enjoy', or 'Have a great day'.\n`;
    prompt += `- Avoid phrases like 'Explore local attractions and experience [destination] culture' (too generic).\n`;
    prompt += `- Ensure travel times and activity timings do not overlap.\n`;
    prompt += `- Each day must have exactly 3 meals (BREAKFAST, LUNCH, DINNER) with specific restaurant suggestions.\n`;
    prompt += `- Every restaurant and hotel must have realistic pricing in ₹.\n`;
    prompt += `- Destination name should be preserved as '${destination}' (maintain original casing).\n\n`;

    prompt += `Generate a JSON response with this exact structure:\n`;
    prompt += `{\n`;
    prompt += `  "tripOverview": {\n`;
    prompt += `    "destination": "${destination}",\n`; // Use fullDestination to preserve casing
    prompt += `    "duration": ${duration},\n`;
    prompt += `    "travelStyle": "${travelStyle}",\n`;
    prompt += `    "travelType": "${travelType}",\n`;
    prompt += `    "totalBudget": ${budget}\n`;
    prompt += `  },\n`;
    prompt += `  "budgetBreakdown": {\n`;
    Object.keys(budgetBreakdown).forEach((category) => {
      const allocation = budgetBreakdown[category];
      const amount = Math.round((budget * allocation.percent) / 100);
      prompt += `    "${category}": { "amount": ${amount}, "description": "${allocation.description}" },\n`;
    });
    prompt += `  },\n`;
    prompt += `  "dailyItinerary": [\n`;

    // Generate day structure
    const dates = [];
    const currentDate = new Date(startDate);
    for (let i = 0; i < duration; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    dates.forEach((date, index) => {
      const dayNum = index + 1;
      const dateString = date.toISOString().split("T")[0];
      prompt += `    {\n`;
      prompt += `      "day": ${dayNum},\n`;
      prompt += `      "date": "${dateString}",\n`;
      prompt += `      "activities": [\n`;
      prompt += `        "Morning: [Specific activity with timing]",\n`;
      prompt += `        "Afternoon: [Specific activity with timing]",\n`;
      prompt += `        "Evening: [Specific activity with timing]"\n`;
      prompt += `      ],\n`;
      prompt += `      "meals": [\n`;
      prompt += `        "BREAKFAST: [1 specific restaurant/cafe name] - [Brief description and price range]",\n`;
      prompt += `        "LUNCH: [1 specific restaurant name] - [Brief description and price range]",\n`;
      prompt += `        "DINNER: [1 specific restaurant name] - [Brief description and price range]"\n`;
      prompt += `      ],\n`;
      prompt += `      "accommodation": "[Specific hotel/guesthouse name with brief details]",\n`;
      prompt += `      "notes": "[Day-specific practical tips and recommendations]"\n`;
      prompt += `    }${index < duration - 1 ? "," : ""}\n`;
    });

    prompt += `  ],\n`;
    prompt += `  "safetyNotes": "General safety tips for ${destination}"\n`;
    prompt += `}\n\n`;

    prompt += `Important guidelines:\n`;
    prompt += `- Activities should be specific to ${destination} with realistic timing\n`;
    prompt += `- Meals should be specific restaurant names with price ranges (₹ per person), limited to 1 option per meal type per day\n`;
    prompt += `- Accommodation should be specific hotel/guesthouse names that fit the budget constraints\n`;
    prompt += `- Notes should be practical day-specific tips (NOT generic phrases)\n`;
    prompt += `- Do NOT repeat meals or accommodation information outside the daily itinerary structure\n`;
    prompt += `- Do NOT generate more than 1 restaurant option per meal type per day\n`;
    prompt += `- Keep all content destination-specific and avoid generic placeholders\n`;

    return prompt;
  }

  // Method to generate only core itinerary (no meals/accommodation)
  async generateItineraryOnly(
    destination,
    startDate,
    endDate,
    budget,
    travelStyle,
    travelType,
    constraints
  ) {
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

      // Generate prompt for itinerary only
      const prompt = this.generateItineraryOnlyPrompt(transformedInput);

      try {
        const aiResponse = await openaiService.generateTravelPlan(prompt);

        // Validate response structure
        if (!this.isValidItineraryResponse(aiResponse)) {
          throw new Error("Invalid response structure from AI");
        }

        return aiResponse;
      } catch (apiError) {
        console.error("AI API Error:", apiError);
        // Fallback to template-based generation
        return this.generateTemplateItinerary(transformedInput);
      }
    } catch (error) {
      console.error("Error in generateItineraryOnly:", error);
      throw error;
    }
  }

  // Generate prompt for core itinerary only (no meals/accommodation)
  generateItineraryOnlyPrompt(input) {
    const {
      destination,
      startDate,
      endDate,
      duration,
      budget,
      travelStyle,
      travelType,
    } = input;

    // Style-based configurations
    const styleConfig = {
      relaxed: { pace: "relaxed", activitiesPerDay: 2 },
      balanced: { pace: "balanced", activitiesPerDay: 3 },
      fast: { pace: "fast-paced", activitiesPerDay: 4 },
    }[travelStyle] || { pace: "balanced", activitiesPerDay: 3 };

    let prompt = `You are an expert AI Travel Planning Assistant. Respond ONLY in valid JSON. Generate ONLY the core ${duration}-day travel itinerary for ${destination} from ${startDate} to ${endDate}. Travel style: ${travelStyle} (${styleConfig.pace} pace). Budget: ₹${budget}. CRITICAL RULES: Generate ONLY daily itinerary with activities. DO NOT include meals, accommodation, or transport details. Activities must be specific to ${destination} with realistic timings. Each day must have exactly ${styleConfig.activitiesPerDay} activities. No generic activities. No generic notes. JSON structure: {"tripOverview": {"destination": "${destination}", "duration": ${duration}, "travelStyle": "${travelStyle}", "travelType": "${travelType}", "totalBudget": ${budget}}, "dailyItinerary": [`;

    const dates = [];
    const currentDate = new Date(startDate);
    for (let i = 0; i < duration; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    dates.forEach((date, index) => {
      const dayNum = index + 1;
      const dateString = date.toISOString().split("T")[0];
      prompt += `{ "day": ${dayNum}, "date": "${dateString}", "activities": [ "Morning: [Specific activity]", "Afternoon: [Specific activity]", "Evening: [Specific activity]" ], "notes": "[Practical day-specific tips]" }${
        index < duration - 1 ? "," : ""
      }`;
    });

    prompt += `]}`;
    return prompt;
  }

  // Validate itinerary-only response structure
  isValidItineraryResponse(response) {
    return (
      response &&
      response.tripOverview &&
      response.dailyItinerary &&
      Array.isArray(response.dailyItinerary) &&
      response.dailyItinerary.length > 0
    );
  }

  // Template-based itinerary generation as fallback
  generateTemplateItinerary(input) {
    const { destination, duration, travelStyle } = input;

    const destinationActivities = {
      jaipur: [
        "Visit Amber Fort - Historic hilltop fort with palace",
        "Explore City Palace - Royal residence with museum",
        "See Hawa Mahal - Iconic palace with 953 windows",
        "Visit Jantar Mantar - Ancient astronomical observatory",
        "Shop at Johari Bazaar - Famous jewelry market",
        "Explore Nahargarh Fort - Hilltop fort with city views",
        "Visit Albert Hall Museum - Art and historical artifacts",
        "Take a rickshaw ride through old city streets",
      ],
      delhi: [
        "Visit Red Fort - Mughal era fort complex",
        "Explore India Gate - War memorial and iconic landmark",
        "See Qutub Minar - Ancient tower and UNESCO site",
        "Visit Humayun's Tomb - Mughal architectural marvel",
        "Explore Lotus Temple - Baháʼí House of Worship",
        "Shop at Chandni Chowk - Historic market area",
        "Visit Akshardham Temple - Hindu temple complex",
        "Explore Connaught Place - Central shopping district",
      ],
      mumbai: [
        "Visit Gateway of India - Colonial-era arch monument",
        "Explore Marine Drive - Scenic waterfront boulevard",
        "See Elephanta Caves - UNESCO World Heritage rock-cut temples",
        "Visit Siddhivinayak Temple - Famous Ganesh temple",
        "Explore Bandra-Worli Sea Link - Cable-stayed bridge",
        "Visit Chhatrapati Shivaji Terminus - Railway station heritage",
        "Explore Juhu Beach - Popular beachfront",
        "Visit Film City - Bollywood film production hub",
      ],
      goa: [
        "Relax at Calangute Beach - Popular beach resort town",
        "Visit Basilica of Bom Jesus - UNESCO World Heritage church",
        "Explore Fort Aguada - Portuguese fort overlooking the sea",
        "See Dudhsagar Falls - Four-tiered waterfall",
        "Explore Old Goa - Former capital with historic churches",
        "Visit Anjuna Flea Market - Weekly market for handicrafts",
        "Explore Spice Plantations - Learn about local spices",
        "Visit Reis Magos Fort - Historic fort overlooking Mandovi River",
      ],
      default: [
        "Visit local historical landmarks and monuments",
        "Explore cultural centers and museums",
        "Discover local markets and shopping areas",
        "Experience natural attractions and parks",
        "Try local cuisine at authentic restaurants",
        "Attend local festivals or events if available",
        "Explore scenic viewpoints and nature trails",
        "Learn about local traditions and crafts",
      ],
    };

    const destKey = (destination || "").toLowerCase().replace(/\s+/g, "");
    const activities =
      destinationActivities[destKey] || destinationActivities.default;

    const dailyItinerary = [];
    const dates = [];
    const currentDate = new Date(input.startDate);

    for (let i = 0; i < duration; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    dates.forEach((date, index) => {
      const dayActivities = [];
      // Select 3 different activities for each day
      for (let j = 0; j < 3; j++) {
        const activityIndex = (index * 3 + j) % activities.length;
        dayActivities.push(activities[activityIndex]);
      }

      dailyItinerary.push({
        day: index + 1,
        date: date.toISOString().split("T")[0],
        activities: dayActivities,
        notes: `Practical tips for day ${index + 1}`,
      });
    });

    return {
      tripOverview: {
        destination: destination,
        duration: duration,
        travelStyle: travelStyle,
        travelType: input.travelType,
        totalBudget: input.budget,
      },
      dailyItinerary: dailyItinerary,
    };
  }

  // Main method to generate complete travel plan
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

      // Generate prompt
      const prompt = this.generateTravelPrompt(transformedInput);

      try {
        const aiResponse = await openaiService.generateTravelPlan(prompt);

        // Validate response structure
        if (!this.isValidResponse(aiResponse)) {
          throw new Error("Invalid response structure from AI");
        }

        // Perform budget validation
        const budgetValidation = this.validateBudgetCompliance(
          aiResponse,
          transformedInput
        );
        if (!budgetValidation.isValid) {
          console.warn("Budget validation failed:", budgetValidation.errors);
          // Fall back to mock response if budget validation fails
          return this.generateMockResponse(transformedInput);
        }

        return aiResponse;
      } catch (aiError) {
        console.log(
          "AI generation failed, falling back to mock:",
          aiError.message
        );
        return this.generateMockResponse(transformedInput);
      }
    } catch (error) {
      throw new Error("Failed to generate travel plan: " + error.message);
    }
  }

  // Method to validate budget compliance
  validateBudgetCompliance(response, transformedInput) {
    const { budget, duration } = transformedInput;
    const errors = [];

    // Check if accommodation fits within budget
    if (response.dailyItinerary && response.dailyItinerary.length > 0) {
      for (const day of response.dailyItinerary) {
        if (day.accommodation) {
          // Extract price information from accommodation string
          const priceMatch = day.accommodation.match(/₹(\d+)-?(\d+)?/);
          if (priceMatch) {
            const lowerPrice = parseInt(priceMatch[1]);
            const upperPrice = priceMatch[2]
              ? parseInt(priceMatch[2])
              : lowerPrice;

            // Calculate average nightly cost across all days
            const avgCostPerNight = (lowerPrice + upperPrice) / 2;
            const totalAccommodationCost = avgCostPerNight * duration;

            // Check if accommodation costs exceed 25% of total budget per night
            const maxPerNight = (budget * 0.25) / duration;
            if (avgCostPerNight > maxPerNight) {
              errors.push(
                `Accommodation cost per night (₹${avgCostPerNight}) exceeds 25% of budget per night (₹${Math.round(
                  maxPerNight
                )})`
              );
            }

            // Check if total accommodation costs exceed allocated budget
            const allocatedStayPercent = 0.35; // Assuming 35% for stay
            const allocatedStayBudget = budget * allocatedStayPercent;
            if (totalAccommodationCost > allocatedStayBudget) {
              errors.push(
                `Total accommodation cost (₹${totalAccommodationCost}) exceeds allocated stay budget (₹${allocatedStayBudget})`
              );
            }
          }
        }
      }
    }

    // Check for luxury accommodations on low budgets
    if (budget < 40000 && response.dailyItinerary) {
      for (const day of response.dailyItinerary) {
        if (
          day.accommodation &&
          (day.accommodation.toLowerCase().includes("luxury") ||
            day.accommodation.toLowerCase().includes("premium") ||
            day.accommodation.toLowerCase().includes("deluxe"))
        ) {
          errors.push("Luxury accommodation suggested for low budget trip");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // More flexible validation for AI responses
  isValidResponse(response) {
    if (!response || typeof response !== "object") {
      return false;
    }

    // Check required top-level fields
    if (!response.tripOverview) {
      console.log("Missing tripOverview");
      return false;
    }

    if (!response.dailyItinerary || !Array.isArray(response.dailyItinerary)) {
      console.log("Missing or invalid dailyItinerary");
      return false;
    }

    // Validate each day in the itinerary
    for (let i = 0; i < response.dailyItinerary.length; i++) {
      const day = response.dailyItinerary[i];

      // Check required day fields
      if (!day.day || typeof day.day !== "number") {
        console.log(`Day ${i + 1} missing or invalid day number`);
        return false;
      }

      if (!day.date || typeof day.date !== "string") {
        console.log(`Day ${i + 1} missing or invalid date`);
        return false;
      }

      // Check activities (strict validation)
      if (
        !day.activities ||
        !Array.isArray(day.activities) ||
        day.activities.length === 0
      ) {
        console.log(`Day ${i + 1} has no activities`);
        return false;
      }

      // Check meals (strict validation - exactly 3 per day)
      if (!day.meals || !Array.isArray(day.meals) || day.meals.length !== 3) {
        console.log(
          `Day ${i + 1} must have exactly 3 meals (breakfast, lunch, dinner)`
        );
        return false;
      }

      // Check accommodation
      if (!day.accommodation || typeof day.accommodation !== "string") {
        console.log(`Day ${i + 1} missing or invalid accommodation`);
        return false;
      }
    }

    return true;
  }

  // Enhanced validation for AI responses
  validateAIResponse(response, transformedInput) {
    const errors = [];
    const { styleConfig = { activitiesPerDay: 3 } } = transformedInput;

    if (!response || typeof response !== "object") {
      errors.push("Response is not a valid object");
      return { isValid: false, errors };
    }

    // Check required top-level fields
    if (!response.tripOverview) {
      errors.push("Missing tripOverview");
    } else {
      // Validate destination casing preservation
      if (
        !response.tripOverview.destination ||
        response.tripOverview.destination !== transformedInput.fullDestination
      ) {
        errors.push("Destination should preserve original casing");
      }
    }

    if (!response.dailyItinerary || !Array.isArray(response.dailyItinerary)) {
      errors.push("Missing or invalid dailyItinerary");
      return { isValid: false, errors };
    }

    // Check for repeated activities across days
    const allActivities = [];
    for (let i = 0; i < response.dailyItinerary.length; i++) {
      const day = response.dailyItinerary[i];

      // Check required day fields
      if (!day.day || typeof day.day !== "number") {
        errors.push(`Day ${i + 1} missing or invalid day number`);
      }

      if (!day.date || typeof day.date !== "string") {
        errors.push(`Day ${i + 1} missing or invalid date`);
      }

      // Check activities (strict validation)
      if (!day.activities || !Array.isArray(day.activities)) {
        errors.push(`Day ${i + 1} missing or invalid activities array`);
      } else if (day.activities.length === 0) {
        errors.push(`Day ${i + 1} has no activities`);
      } else if (day.activities.length < styleConfig.activitiesPerDay) {
        errors.push(
          `Day ${i + 1} has insufficient activities (${
            day.activities.length
          } < ${styleConfig.activitiesPerDay})`
        );
      } else {
        // Collect activities for duplicate checking
        day.activities.forEach((activity) => {
          allActivities.push({ activity, day: day.day });
        });
      }

      // Check meals (strict validation - exactly 3 per day)
      if (!day.meals || !Array.isArray(day.meals)) {
        errors.push(`Day ${i + 1} missing or invalid meals array`);
      } else if (day.meals.length !== 3) {
        errors.push(
          `Day ${
            i + 1
          } must have exactly 3 meals (breakfast, lunch, dinner), got ${
            day.meals.length
          }`
        );
      }

      // Check accommodation
      if (!day.accommodation || typeof day.accommodation !== "string") {
        errors.push(`Day ${i + 1} missing or invalid accommodation`);
      }

      // Check for generic notes that should be avoided
      if (
        day.notes &&
        (day.notes.includes("Enjoy your day") ||
          day.notes.includes("Relax and enjoy") ||
          day.notes.includes("Have a great day"))
      ) {
        errors.push(`Day ${i + 1} contains generic filler text in notes`);
      }
    }

    // Check for repeated activities across days
    const activityCounts = {};
    allActivities.forEach(({ activity }) => {
      const activityText = activity.toLowerCase().replace(/[^\w\s]/gi, "");
      activityCounts[activityText] = (activityCounts[activityText] || 0) + 1;
    });

    for (const [activity, count] of Object.entries(activityCounts)) {
      if (count > 1) {
        errors.push(
          `Activity "${activity}" is repeated across multiple days (${count} times)`
        );
      }
    }

    // Check if any day has too many activities
    for (let i = 0; i < response.dailyItinerary.length; i++) {
      const day = response.dailyItinerary[i];
      if (
        day.activities &&
        day.activities.length > styleConfig.activitiesPerDay * 2
      ) {
        errors.push(
          `Day ${i + 1} has excessive activities (${day.activities.length} > ${
            styleConfig.activitiesPerDay * 2
          })`
        );
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Enhanced mock response generation with destination-specific content
  generateMockResponse(transformedInput) {
    const {
      fullDestination,
      startDate,
      endDate,
      duration,
      budget,
      travelStyle,
      travelType,
      constraints = [],
    } = transformedInput;

    // Determine budget tier
    const budgetTier =
      budget < 15000 ? "low" : budget < 30000 ? "medium" : "high";

    // Determine destination-specific activities based on common destinations
    const destinationActivities = {
      jaipur: [
        "Visit Amber Fort - Historic hilltop fort with palace",
        "Explore City Palace - Royal residence with museum",
        "See Hawa Mahal - Iconic palace with 953 windows",
        "Visit Jantar Mantar - Ancient astronomical observatory",
        "Shop at Johari Bazaar - Famous jewelry market",
        "Explore Nahargarh Fort - Hilltop fort with city views",
        "Visit Albert Hall Museum - Art and historical artifacts",
        "Take a rickshaw ride through old city streets",
      ],
      delhi: [
        "Visit Red Fort - Mughal era fort complex",
        "Explore India Gate - War memorial and iconic landmark",
        "See Qutub Minar - Ancient tower and UNESCO site",
        "Visit Humayun's Tomb - Mughal architectural marvel",
        "Explore Lotus Temple - Baháʼí House of Worship",
        "Shop at Chandni Chowk - Historic market area",
        "Visit Akshardham Temple - Hindu temple complex",
        "Explore Connaught Place - Central shopping district",
      ],
      mumbai: [
        "Visit Gateway of India - Colonial-era arch monument",
        "Explore Marine Drive - Scenic waterfront boulevard",
        "See Elephanta Caves - UNESCO World Heritage rock-cut temples",
        "Visit Siddhivinayak Temple - Famous Ganesh temple",
        "Explore Bandra-Worli Sea Link - Cable-stayed bridge",
        "Visit Chhatrapati Shivaji Terminus - Railway station heritage",
        "Explore Juhu Beach - Popular beachfront",
        "Visit Film City - Bollywood film production hub",
      ],
      goa: [
        "Relax at Calangute Beach - Popular beach resort town",
        "Visit Basilica of Bom Jesus - UNESCO World Heritage church",
        "Explore Fort Aguada - Portuguese fort overlooking the sea",
        "See Dudhsagar Falls - Four-tiered waterfall",
        "Explore Old Goa - Former capital with historic churches",
        "Visit Anjuna Flea Market - Weekly market for handicrafts",
        "Explore Spice Plantations - Learn about local spices",
        "Visit Reis Magos Fort - Historic fort overlooking Mandovi River",
      ],
      default: [
        "Visit local historical landmarks and monuments",
        "Explore cultural centers and museums",
        "Discover local markets and shopping areas",
        "Experience natural attractions and parks",
        "Try local cuisine at authentic restaurants",
        "Attend local festivals or events if available",
        "Explore scenic viewpoints and nature trails",
        "Learn about local traditions and crafts",
      ],
    };

    const destKey = (fullDestination || "").toLowerCase().replace(/\s+/g, "");
    const activities =
      destinationActivities[destKey] || destinationActivities.default;

    // Generate daily itinerary
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

      // Select 3-4 activities for the day
      const dayActivities = [];
      for (let j = 0; j < 3; j++) {
        const activityIndex = (i * 3 + j) % activities.length;
        dayActivities.push(activities[activityIndex]);
      }

      // Generate meals based on budget tier
      const getMealOption = (mealType) => {
        if (budgetTier === "low") {
          switch (mealType) {
            case "breakfast":
              return `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              }: Local café - Regional breakfast (₹100-200 per person) (Searchable on Google Maps)`;
            case "lunch":
              return `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              }: Street food area - Local cuisine (₹150-250 per person) (Searchable on Google Maps)`;
            case "dinner":
              return `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              }: Local restaurant - Regional dishes (₹200-350 per person) (Searchable on Google Maps)`;
          }
        } else if (budgetTier === "medium") {
          switch (mealType) {
            case "breakfast":
              return `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              }: Café in hotel/restaurant - Continental/Indian breakfast (₹200-350 per person) (Searchable on Google Maps)`;
            case "lunch":
              return `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              }: Mid-range restaurant - Regional cuisine (₹300-500 per person) (Searchable on Google Maps)`;
            case "dinner":
              return `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              }: Themed restaurant - Multi-cuisine (₹500-800 per person) (Searchable on Google Maps)`;
          }
        } else {
          // high budget
          switch (mealType) {
            case "breakfast":
              return `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              }: Hotel restaurant - Gourmet breakfast (₹350-500 per person) (Searchable on Google Maps)`;
            case "lunch":
              return `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              }: Fine dining restaurant - International cuisine (₹600-1000 per person) (Searchable on Google Maps)`;
            case "dinner":
              return `${
                mealType.charAt(0).toUpperCase() + mealType.slice(1)
              }: Upscale restaurant - Signature dishes (₹1000-1500 per person) (Searchable on Google Maps)`;
          }
        }
      };

      // Generate accommodation based on budget tier
      let accommodation;
      if (budgetTier === "low") {
        accommodation = "Budget hotel near city center (₹800-1500/night)";
      } else if (budgetTier === "medium") {
        accommodation = "Mid-range hotel with amenities (₹1500-3500/night)";
      } else {
        accommodation =
          "Comfortable hotel with good facilities (₹3500-6000/night)";
      }

      dailyItinerary.push({
        day: dayNum,
        date: dateString,
        activities: dayActivities,
        meals: [
          getMealOption("breakfast"),
          getMealOption("lunch"),
          getMealOption("dinner"),
        ],
        accommodation: accommodation,
        notes:
          "Carry comfortable shoes, stay hydrated, and respect local customs. Check opening hours before visiting attractions.",
      });
    }

    // Calculate budget breakdown
    const budgetBreakdown = {
      stay: {
        amount: Math.round(budget * 0.35),
        description:
          budgetTier === "low"
            ? "Budget hotels/guesthouses"
            : budgetTier === "medium"
            ? "Mid-range hotels"
            : "Comfortable hotels with amenities",
      },
      food: {
        amount: Math.round(budget * 0.25),
        description:
          budgetTier === "low"
            ? "Street food and local eateries"
            : budgetTier === "medium"
            ? "Mix of local and mid-range restaurants"
            : "Fine dining and upscale restaurants",
      },
      transport: {
        amount: Math.round(budget * 0.15),
        description: "Local transport and taxis",
      },
      activities: {
        amount: Math.round(budget * 0.2),
        description: "Entry fees and guided tours",
      },
      contingency: {
        amount: Math.round(budget * 0.05),
        description: "Emergency buffer",
      },
    };

    // Adjust for travel style
    if (travelStyle === "chill") {
      budgetBreakdown.activities.amount = Math.round(budget * 0.15);
      budgetBreakdown.food.amount = Math.round(budget * 0.3);
      budgetBreakdown.stay.amount = Math.round(budget * 0.4);
    } else if (travelStyle === "fast-paced") {
      budgetBreakdown.activities.amount = Math.round(budget * 0.25);
      budgetBreakdown.transport.amount = Math.round(budget * 0.2);
      budgetBreakdown.food.amount = Math.round(budget * 0.2);
    }

    return {
      tripOverview: {
        destination: fullDestination,
        duration: duration,
        travelStyle: travelStyle,
        travelType: travelType,
        totalBudget: budget,
      },
      budgetBreakdown: budgetBreakdown,
      dailyItinerary: dailyItinerary,
      safetyNotes: this.generateSafetyNotes(fullDestination, travelType),
    };
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
  async generateItinerary(
    destination,
    startDate,
    endDate,
    budget,
    travelStyle,
    travelType,
    constraints
  ) {
    try {
      console.log("AI Service: generateItinerary called with:", {
        destination,
        startDate,
        endDate,
        budget,
        travelStyle,
        travelType,
        constraints,
      });

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

      console.log("Transformed input:", transformedInput);

      // Generate focused itinerary prompt
      const prompt = this.generateItineraryPrompt(transformedInput);

      console.log("Generated prompt:", prompt.substring(0, 200) + "...");

      try {
        const aiResponse = await openaiService.generateTravelPlan(prompt);
        console.log("AI response received:", aiResponse);

        // Validate and extract itinerary
        if (aiResponse && aiResponse.dailyItinerary) {
          console.log("Valid itinerary response found");
          return {
            dailyItinerary: aiResponse.dailyItinerary,
            tripOverview: aiResponse.tripOverview || transformedInput,
          };
        } else {
          console.log("Invalid itinerary response, falling back to mock");
          throw new Error("Invalid itinerary response from AI");
        }
      } catch (aiError) {
        console.log(
          "AI itinerary generation failed, falling back to mock:",
          aiError.message
        );
        // Fallback to mock itinerary
        const mockResult = this.generateMockItinerary(transformedInput);
        console.log("Mock itinerary generated:", mockResult);
        return mockResult;
      }
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      throw new Error("Failed to generate itinerary: " + error.message);
    }
  }

  // Generate only meal options component
  async generateMeals(
    destination,
    startDate,
    endDate,
    budget,
    travelStyle,
    travelType,
    constraints
  ) {
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
            tripOverview: transformedInput,
          };
        } else {
          throw new Error("Invalid meals response from AI");
        }
      } catch (aiError) {
        console.log(
          "AI meals generation failed, falling back to mock:",
          aiError.message
        );
        // Fallback to mock meals
        return this.generateMockMeals(transformedInput);
      }
    } catch (error) {
      throw new Error("Failed to generate meals: " + error.message);
    }
  }

  // Generate only accommodation options component
  async generateAccommodation(
    destination,
    startDate,
    endDate,
    budget,
    travelStyle,
    travelType,
    constraints
  ) {
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
            tripOverview: transformedInput,
          };
        } else {
          throw new Error("Invalid accommodation response from AI");
        }
      } catch (aiError) {
        console.log(
          "AI accommodation generation failed, falling back to mock:",
          aiError.message
        );
        // Fallback to mock accommodation
        return this.generateMockAccommodation(transformedInput);
      }
    } catch (error) {
      throw new Error("Failed to generate accommodation: " + error.message);
    }
  }

  // Generate only transport options component
  async generateTransport(
    destination,
    startDate,
    endDate,
    budget,
    travelStyle,
    travelType,
    constraints
  ) {
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
            tripOverview: transformedInput,
          };
        } else {
          throw new Error("Invalid transport response from AI");
        }
      } catch (aiError) {
        console.log(
          "AI transport generation failed, falling back to mock:",
          aiError.message
        );
        // Fallback to mock transport
        return this.generateMockTransport(transformedInput);
      }
    } catch (error) {
      throw new Error("Failed to generate transport: " + error.message);
    }
  }

  // Generate focused prompts for each component
  generateItineraryPrompt(transformedInput) {
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

    return `
    You are an expert AI Travel Planning Assistant.
    Respond ONLY in valid JSON.
    Do NOT include explanations, markdown, headings, or extra text outside JSON.
    Do NOT repeat global sections like meals or accommodation outside the defined JSON structure.
    Do NOT generate more than 1 meal option per meal type per day.

    QUALITY REQUIREMENTS:
    - Each day must have exactly 3 activities (morning, afternoon, evening) based on ${travelStyle} pace.
    - Do NOT repeat the same activity across multiple days.
    - Do NOT include generic notes like 'Enjoy your day', 'Relax and enjoy', or 'Have a great day'.
    - Avoid phrases like 'Explore local attractions and experience [destination] culture' (too generic).
    - Ensure travel times and activity timings do not overlap.
    - Destination name should be preserved as '${destination}' (maintain original casing).

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
            "Morning: [Specific activity with timing] - [Brief description]",
            "Afternoon: [Specific activity with timing] - [Brief description]",
            "Evening: [Specific activity with timing] - [Brief description]"
          ],
          "notes": "[Day-specific practical tips and recommendations]"
        }
      ]
    }
    `;
  }

  generateMealsPrompt(transformedInput) {
    const {
      fullDestination: destination,
      startDate,
      endDate,
      duration,
      budget,
      travelStyle,
      travelType,
      constraints,
    } = transformedInput;

    // Determine budget tier
    const budgetTier =
      budget < 15000 ? "low" : budget < 30000 ? "medium" : "high";

    return `
    You are an expert AI Travel Planning Assistant.
    Respond ONLY in valid JSON.
    Do NOT include explanations, markdown, headings, or extra text outside JSON.
    Do NOT repeat global sections like meals or accommodation outside the defined JSON structure.
    Do NOT generate more than 1 meal option per meal type per day.

    QUALITY REQUIREMENTS:
    - Provide exactly 10 restaurant options for EACH meal type (breakfast, lunch, dinner)
    - Include realistic pricing in ₹ per person
    - Specify cuisine type and specialties
    - Include practical location information
    - Destination name should be preserved as '${destination}' (maintain original casing)

    Generate detailed meal options for ${destination} for a ${duration}-day trip with budget of ${budget} INR (${budgetTier} budget tier).

    Provide 10 options for each meal type:
    - Breakfast options with local specialties and café culture
    - Lunch options with regional cuisine and quick service
    - Dinner options with fine dining and local restaurants
    - Include price ranges, cuisine types, specialties, and location hints

    JSON format:
    {
      "meals": {
        "breakfast": [
          {
            "name": "[Specific restaurant/café name]",
            "cuisine": "[Cuisine type]",
            "priceRange": "₹[min]-[max] per person",
            "specialties": "[Key dishes and specialties]",
            "location": "[Area/neighborhood]",
            "description": "[Brief description of atmosphere]"
          }
        ],
        "lunch": [
          // 10 lunch options with same structure
        ],
        "dinner": [
          // 10 dinner options with same structure
        ]
      }
    }
    `;
  }

  generateAccommodationPrompt(transformedInput) {
    const {
      fullDestination: destination,
      startDate,
      endDate,
      duration,
      budget,
      travelStyle,
      travelType,
      constraints,
    } = transformedInput;

    // Calculate budget allocations
    const budgetBreakdown = {
      stay: { percent: 35, description: "Mid-range hotels/guesthouses" },
      food: {
        percent: 25,
        description: "Mix of local restaurants and street food",
      },
      transport: { percent: 15, description: "Local transport and taxis" },
      activities: { percent: 20, description: "Entry fees and guided tours" },
      contingency: { percent: 5, description: "Emergency buffer" },
    };

    // Adjust based on travel style
    if (travelStyle === "chill") {
      budgetBreakdown.stay.percent = 40;
    } else if (travelStyle === "fast-paced") {
      budgetBreakdown.activities.percent = 25;
      budgetBreakdown.stay.percent = 30;
    }

    const stayBudget = Math.round(
      (budget * budgetBreakdown.stay.percent) / 100
    );
    const avgStayPerNight = Math.round(stayBudget / duration);

    return `
    You are an expert AI Travel Planning Assistant.
    Respond ONLY in valid JSON.
    Do NOT include explanations, markdown, headings, or extra text outside JSON.
    Do NOT repeat global sections like meals or accommodation outside the defined JSON structure.
    Do NOT generate more than 1 meal option per meal type per day.

    Generate accommodation options for ${destination} for ${duration} nights with budget of ${budget} INR.

    Budget allocation: Stay budget is ₹${stayBudget} for ${duration} nights (avg ₹${avgStayPerNight}/night).

    CRITICAL RULES:
    - Accommodation options MUST fit within the accommodation budget of ₹${stayBudget} for ${duration} nights (avg ₹${avgStayPerNight}/night).
    - If budget is low (under ₹15,000 total), prioritize hostels or budget hotels (₹500-1500/night).
    - If budget is moderate (₹15,000-30,000 total), suggest mid-range hotels (₹1500-4000/night).
    - NEVER suggest luxury hotels if total trip budget < ₹40,000.
    - NEVER suggest accommodation that costs more than 25% of total budget per night.

    QUALITY REQUIREMENTS:
    - Provide exactly 10 accommodation options across different categories
    - Include realistic pricing and amenities
    - Specify exact locations/neighborhoods
    - Include contact information format
    - Destination name should be preserved as '${destination}' (maintain original casing)

    Provide 10 accommodation options across these categories:
    - Budget options (hostels, guesthouses) - 4 options
    - Mid-range hotels - 4 options
    - Luxury options (only if budget > ₹40,000) - 2 options

    JSON format:
    {
      "accommodation": [
        {
          "name": "[Specific hotel/guesthouse name]",
          "category": "budget/mid-range/luxury",
          "priceRange": "₹[min]-[max] per night",
          "amenities": ["amenity1", "amenity2", "amenity3"],
          "location": "[Specific area/neighborhood]",
          "contact": "[Phone number format]",
          "description": "[Brief description of property]",
          "rating": "[Star rating if applicable]"
        }
      ]
    }
    `;
  }

  generateTransportPrompt(transformedInput) {
    const {
      fullDestination: destination,
      startDate,
      endDate,
      duration,
      budget,
      travelStyle,
      travelType,
      constraints,
    } = transformedInput;

    return `
    You are an expert AI Travel Planning Assistant.
    Respond ONLY in valid JSON.
    Do NOT include explanations, markdown, headings, or extra text outside JSON.
    Do NOT repeat global sections like meals or accommodation outside the defined JSON structure.
    Do NOT generate more than 1 meal option per meal type per day.

    QUALITY REQUIREMENTS:
    - Provide comprehensive transport options with 10+ detailed options
    - Include realistic pricing and availability information
    - Specify exact service providers and booking methods
    - Include practical tips for each transport mode
    - Destination name should be preserved as '${destination}' (maintain original casing)

    Generate transportation options for ${destination} for a ${duration}-day trip.

    Include comprehensive information about:
    - Local transportation options (10+ detailed options)
    - App-based services with specific providers
    - Airport/station transfers
    - Estimated costs and travel times
    - Booking methods and availability
    - Practical travel tips

    JSON format:
    {
      "transport": {
        "localOptions": [
          {
            "name": "[Transport service name]",
            "type": "[Vehicle type/service category]",
            "description": "[Detailed description of service]",
            "costEstimate": "₹[amount] per trip/[per km]",
            "availability": "[Operating hours and frequency]",
            "bookingMethod": "[How to book/reserve]",
            "tips": "[Practical usage tips]"
          }
        ],
        "appServices": [
          {
            "name": "[App/company name]",
            "description": "[Service details]",
            "costEstimate": "₹[base fare] + ₹[per km] + ₹[per minute]",
            "availability": "[Service area and hours]",
            "bookingMethod": "[App download and booking process]",
            "vehicleTypes": ["type1", "type2"]
          }
        ],
        "airportTransfers": [
          {
            "name": "[Transfer service name]",
            "type": "[Service type]",
            "description": "[Details about service]",
            "costRange": "₹[min]-[max]",
            "bookingMethod": "[How to arrange]"
          }
        ],
        "tips": [
          "tip1",
          "tip2",
          "tip3"
        ]
      }
    }
    `;
  }

  // Mock generators for fallback
  generateMockItinerary(transformedInput) {
    const { fullDestination, duration, startDate } = transformedInput;

    // Determine destination-specific activities
    const destinationActivities = {
      jaipur: [
        "Visit Amber Fort - Historic hilltop fort with palace",
        "Explore City Palace - Royal residence with museum",
        "See Hawa Mahal - Iconic palace with 953 windows",
        "Visit Jantar Mantar - Ancient astronomical observatory",
        "Shop at Johari Bazaar - Famous jewelry market",
        "Explore Nahargarh Fort - Hilltop fort with city views",
        "Visit Albert Hall Museum - Art and historical artifacts",
        "Take a rickshaw ride through old city streets",
      ],
      delhi: [
        "Visit Red Fort - Mughal era fort complex",
        "Explore India Gate - War memorial and iconic landmark",
        "See Qutub Minar - Ancient tower and UNESCO site",
        "Visit Humayun's Tomb - Mughal architectural marvel",
        "Explore Lotus Temple - Baháʼí House of Worship",
        "Shop at Chandni Chowk - Historic market area",
        "Visit Akshardham Temple - Hindu temple complex",
        "Explore Connaught Place - Central shopping district",
      ],
      mumbai: [
        "Visit Gateway of India - Colonial-era arch monument",
        "Explore Marine Drive - Scenic waterfront boulevard",
        "See Elephanta Caves - UNESCO World Heritage rock-cut temples",
        "Visit Siddhivinayak Temple - Famous Ganesh temple",
        "Explore Bandra-Worli Sea Link - Cable-stayed bridge",
        "Visit Chhatrapati Shivaji Terminus - Railway station heritage",
        "Explore Juhu Beach - Popular beachfront",
        "Visit Film City - Bollywood film production hub",
      ],
      goa: [
        "Relax at Calangute Beach - Popular beach resort town",
        "Visit Basilica of Bom Jesus - UNESCO World Heritage church",
        "Explore Fort Aguada - Portuguese fort overlooking the sea",
        "See Dudhsagar Falls - Four-tiered waterfall",
        "Explore Old Goa - Former capital with historic churches",
        "Visit Anjuna Flea Market - Weekly market for handicrafts",
        "Explore Spice Plantations - Learn about local spices",
        "Visit Reis Magos Fort - Historic fort overlooking Mandovi River",
      ],
      default: [
        "Visit local historical landmarks and monuments",
        "Explore cultural centers and museums",
        "Discover local markets and shopping areas",
        "Experience natural attractions and parks",
        "Try local cuisine at authentic restaurants",
        "Attend local festivals or events if available",
        "Explore scenic viewpoints and nature trails",
        "Learn about local traditions and crafts",
      ],
    };

    const destKey = (fullDestination || "").toLowerCase().replace(/\s+/g, "");
    const activities =
      destinationActivities[destKey] || destinationActivities.default;

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

      // Select 3-4 activities for the day
      const dayActivities = [];
      for (let j = 0; j < 3; j++) {
        const activityIndex = (i * 3 + j) % activities.length;
        dayActivities.push(`Morning: ${activities[activityIndex]}`);
        dayActivities.push(
          `Afternoon: ${activities[(activityIndex + 1) % activities.length]}`
        );
        dayActivities.push(
          `Evening: ${activities[(activityIndex + 2) % activities.length]}`
        );
        break; // Just take one set of morning/afternoon/evening activities per day
      }

      dailyItinerary.push({
        day: dayNum,
        date: dateString,
        activities: dayActivities,
        notes:
          "Carry comfortable shoes, stay hydrated, and respect local customs. Check opening hours before visiting attractions.",
      });
    }

    return {
      dailyItinerary,
      tripOverview: transformedInput,
    };
  }

  generateMockMeals(transformedInput) {
    const { fullDestination, budget } = transformedInput;

    // Determine budget tier
    const budgetTier =
      budget < 15000 ? "low" : budget < 30000 ? "medium" : "high";

    // Generate 10 options for each meal type
    const generateMealOptions = (mealType) => {
      const options = [];
      const baseNames = [
        "Local Café",
        "Street Food Corner",
        "Regional Restaurant",
        "Popular Eatery",
        "Traditional Kitchen",
        "Local Dhaba",
        "Famous Restaurant",
        "Heritage Café",
        "Popular Chain",
        "Local Favorite",
      ];

      for (let i = 0; i < 10; i++) {
        let priceRange, cuisine, specialties;

        if (budgetTier === "low") {
          priceRange =
            mealType === "breakfast"
              ? "₹50-150"
              : mealType === "lunch"
              ? "₹100-200"
              : "₹150-250";
          cuisine =
            mealType === "breakfast"
              ? "Local Breakfast"
              : mealType === "lunch"
              ? "Street Food"
              : "Regional Cuisine";
          specialties =
            mealType === "breakfast"
              ? "Poha, Idli, Paratha"
              : mealType === "lunch"
              ? "Biryani, Thali, Chaat"
              : "Butter Chicken, Biryani, Local Specialties";
        } else if (budgetTier === "medium") {
          priceRange =
            mealType === "breakfast"
              ? "₹150-300"
              : mealType === "lunch"
              ? "₹200-400"
              : "₹300-500";
          cuisine =
            mealType === "breakfast"
              ? "Continental/Indian"
              : mealType === "lunch"
              ? "Regional Specialties"
              : "Multi-cuisine";
          specialties =
            mealType === "breakfast"
              ? "Pancakes, Omelets, Indian Breakfast"
              : mealType === "lunch"
              ? "Thali, Biryani, Curries"
              : "Specialty Dishes, Desserts";
        } else {
          priceRange =
            mealType === "breakfast"
              ? "₹300-500"
              : mealType === "lunch"
              ? "₹400-700"
              : "₹600-1000";
          cuisine =
            mealType === "breakfast"
              ? "Gourmet Breakfast"
              : mealType === "lunch"
              ? "Fine Dining"
              : "Upscale Multi-cuisine";
          specialties =
            mealType === "breakfast"
              ? "Gourmet Items, Premium Coffee"
              : mealType === "lunch"
              ? "Signature Dishes, Premium Ingredients"
              : "Chef's Specialties, International Cuisine";
        }

        options.push({
          name: `${baseNames[i]} ${fullDestination}`,
          cuisine: cuisine,
          priceRange: `${priceRange} per person`,
          specialties: specialties,
          location: `Popular area in ${fullDestination}`,
          description: `Well-known ${mealType} spot in ${fullDestination} offering authentic local cuisine`,
        });
      }

      return options;
    };

    return {
      meals: {
        breakfast: generateMealOptions("breakfast"),
        lunch: generateMealOptions("lunch"),
        dinner: generateMealOptions("dinner"),
      },
      tripOverview: transformedInput,
    };
  }

  generateMockAccommodation(transformedInput) {
    const { fullDestination, budget } = transformedInput;

    // Determine budget tier
    const budgetTier =
      budget < 15000 ? "low" : budget < 30000 ? "medium" : "high";

    const accommodations = [];

    // Generate 10 accommodation options
    if (budgetTier === "low") {
      // 4 budget options
      accommodations.push(
        {
          name: `Budget Guesthouse ${fullDestination}`,
          category: "budget",
          priceRange: "₹400-800 per night",
          amenities: ["Basic Wi-Fi", "Fan", "Shared Bathroom", "24/7 Security"],
          location: `Central ${fullDestination}`,
          contact: "+91-XXXXXXXXXX",
          description: `Affordable guesthouse in central ${fullDestination} with essential amenities`,
          rating: "3.2/5",
        },
        {
          name: `Backpacker Hostel ${fullDestination}`,
          category: "budget",
          priceRange: "₹300-600 per night",
          amenities: [
            "Dormitory Beds",
            "Shared Kitchen",
            "Common Areas",
            "Free Wi-Fi",
          ],
          location: `Backpacker Area ${fullDestination}`,
          contact: "+91-XXXXXXXXXX",
          description: `Budget-friendly hostel perfect for solo travelers and backpackers`,
          rating: "3.5/5",
        },
        {
          name: `Local Lodge ${fullDestination}`,
          category: "budget",
          priceRange: "₹500-900 per night",
          amenities: ["AC Rooms", "TV", "Attached Bathroom", "Room Service"],
          location: `Residential Area ${fullDestination}`,
          contact: "+91-XXXXXXXXXX",
          description: `Simple but clean lodge with basic comforts`,
          rating: "3.0/5",
        },
        {
          name: `Economy Hotel ${fullDestination}`,
          category: "budget",
          priceRange: "₹600-1000 per night",
          amenities: ["Wi-Fi", "AC", "Restaurant", "24/7 Check-in"],
          location: `Business District ${fullDestination}`,
          contact: "+91-XXXXXXXXXX",
          description: `Budget hotel with reliable service and central location`,
          rating: "3.4/5",
        }
      );

      // 4 mid-range options
      accommodations.push(
        {
          name: `City Center Hotel ${fullDestination}`,
          category: "mid-range",
          priceRange: "₹1200-2000 per night",
          amenities: [
            "Free Wi-Fi",
            "AC",
            "Restaurant",
            "Room Service",
            "24/7 Security",
          ],
          location: `City Center ${fullDestination}`,
          contact: "+91-XXXXXXXXXX",
          description: `Comfortable hotel in the heart of the city with modern amenities`,
          rating: "4.0/5",
        },
        {
          name: `Heritage Hotel ${fullDestination}`,
          category: "mid-range",
          priceRange: "₹1500-2500 per night",
          amenities: [
            "Wi-Fi",
            "AC",
            "Multi-cuisine Restaurant",
            "Swimming Pool",
            "Spa",
          ],
          location: `Historic Area ${fullDestination}`,
          contact: "+91-XXXXXXXXXX",
          description: `Boutique hotel blending modern comfort with heritage architecture`,
          rating: "4.2/5",
        },
        {
          name: `Business Hotel ${fullDestination}`,
          category: "mid-range",
          priceRange: "₹1800-3000 per night",
          amenities: [
            "Wi-Fi",
            "AC",
            "Business Center",
            "Gym",
            "Restaurant",
            "Conference Room",
          ],
          location: `Business District ${fullDestination}`,
          contact: "+91-XXXXXXXXXX",
          description: `Professional hotel with excellent facilities for business and leisure travelers`,
          rating: "4.1/5",
        },
        {
          name: `Resort Style Hotel ${fullDestination}`,
          category: "mid-range",
          priceRange: "₹2000-3500 per night",
          amenities: [
            "Wi-Fi",
            "AC",
            "Swimming Pool",
            "Garden",
            "Restaurant",
            "Spa Services",
          ],
          location: `Suburban Area ${fullDestination}`,
          contact: "+91-XXXXXXXXXX",
          description: `Resort-like experience with comfortable rooms and recreational facilities`,
          rating: "4.3/5",
        }
      );
    }

    // 2 luxury options (only if budget allows)
    if (budget > 40000) {
      accommodations.push(
        {
          name: `Luxury Grand Hotel ${fullDestination}`,
          category: "luxury",
          priceRange: "₹4000-7000 per night",
          amenities: [
            "Wi-Fi",
            "AC",
            "Fine Dining",
            "Swimming Pool",
            "Spa",
            "Gym",
            "Concierge",
            "Valet Parking",
          ],
          location: `Prime Location ${fullDestination}`,
          contact: "+91-XXXXXXXXXX",
          description: `Premium luxury hotel with world-class facilities and exceptional service`,
          rating: "4.8/5",
        },
        {
          name: `Premium Business Hotel ${fullDestination}`,
          category: "luxury",
          priceRange: "₹5000-8000 per night",
          amenities: [
            "Wi-Fi",
            "AC",
            "Executive Lounge",
            "Business Center",
            "Multiple Restaurants",
            "Conference Facilities",
            "Fitness Center",
            "24/7 Room Service",
          ],
          location: `Central Business District ${fullDestination}`,
          contact: "+91-XXXXXXXXXX",
          description: `Top-tier business hotel with luxurious accommodations and comprehensive amenities`,
          rating: "4.7/5",
        }
      );
    }

    return {
      accommodation: accommodations,
      tripOverview: transformedInput,
    };
  }

  generateMockTransport(transformedInput) {
    const { fullDestination } = transformedInput;

    return {
      transport: {
        localOptions: [
          {
            name: "Auto-rickshaw",
            type: "Three-wheeled vehicle",
            description:
              "Most common and affordable mode of transport for short distances",
            costEstimate: "₹50-150 per trip",
            availability: "Available throughout the city, 24/7",
            bookingMethod:
              "Hail on street or use auto stand, negotiate fare or use meter",
            tips: "Always insist on using meter or agree on fare before starting, avoid overcharging",
          },
          {
            name: "City Buses",
            type: "Public bus service",
            description:
              "Economical option for longer distances within the city",
            costEstimate: "₹10-30 per trip",
            availability: "Operating from 5 AM to 10 PM daily",
            bookingMethod:
              "Pay cash to conductor on board, exact change preferred",
            tips: "Check routes carefully, carry small denominations, buses can get crowded during rush hours",
          },
          {
            name: "Local Trains/Metro",
            type: "Rail-based public transport",
            description:
              "Fast and reliable transport for specific destinations with metro connectivity",
            costEstimate: "₹10-40 per trip",
            availability:
              "Operating from 6 AM to 11 PM, frequency every 5-10 minutes",
            bookingMethod:
              "Smart card or ticket from station counters, scan at entry/exit gates",
            tips: "Get local transport card for discounted rates, peak hours 8-10 AM and 5-7 PM",
          },
          {
            name: "Taxi Services",
            type: "Pre-paid and post-paid taxi",
            description:
              "Safe and convenient point-to-point travel within city limits",
            costEstimate: "₹100-300 for moderate distances within city",
            availability:
              "Multiple registered operators serving commercial and residential areas",
            bookingMethod:
              "Book through hotel concierge, taxi stands, or mobile apps",
            tips: "Use only registered taxis, insist on meter, keep hotel contact handy for emergencies",
          },
          {
            name: "Cycle Rickshaw",
            type: "Pedal-powered three-wheeler",
            description:
              "Eco-friendly option for very short distances in old city areas",
            costEstimate: "₹30-80 per trip",
            availability: "Common in old city areas and narrow lanes",
            bookingMethod:
              "Hail from street side, negotiate fare before boarding",
            tips: "Best for short distances under 2 km, slower but authentic local experience",
          },
          {
            name: "App-based Cabs (Ola/Uber)",
            type: "Technology-enabled cab services",
            description:
              "Convenient booking through mobile apps with various vehicle categories",
            costEstimate:
              "₹80-250 for city travel depending on vehicle type and distance",
            availability: "24/7 service with wide coverage across city",
            bookingMethod:
              "Download Ola/Uber app, create account, book ride with real-time tracking",
            tips: "Share trip details with someone, verify driver details before boarding, cashless payment preferred",
          },
          {
            name: "Local Train Services",
            type: "Suburban rail network",
            description:
              "Connects various parts of the city and suburbs efficiently",
            costEstimate: "₹5-25 per trip depending on distance",
            availability:
              "Frequent services from early morning to late evening",
            bookingMethod:
              "Platform tickets from station counters, board designated coaches",
            tips: "Check timetable for frequency, first class coaches available for comfort, peak hour crowds",
          },
          {
            name: "Rental Scooters/Bikes",
            type: "Self-driven two-wheelers",
            description:
              "Flexible personal transport option for confident riders",
            costEstimate: "₹300-500 per day",
            availability: "Multiple rental agencies in commercial areas",
            bookingMethod:
              "Valid driving license required, deposit needed, helmet provided",
            tips: "Wear helmet, follow traffic rules, check vehicle condition before rental, fuel extra cost",
          },
          {
            name: "Hotel Shuttle Services",
            type: "Complimentary guest transportation",
            description:
              "Free transport provided by hotels for guest convenience",
            costEstimate: "Free for hotel guests",
            availability: "Specific timings based on hotel policy",
            bookingMethod: "Contact hotel reception for schedule and booking",
            tips: "Check availability and schedule in advance, limited to hotel guests, may have capacity restrictions",
          },
          {
            name: "Tourist Transport Services",
            type: "Specialized sightseeing transport",
            description:
              "Dedicated services for tourists with knowledgeable guides",
            costEstimate: "₹500-1500 per day depending on package",
            availability:
              "Operational during tourist season, advance booking recommended",
            bookingMethod:
              "Tourist information centers, hotel travel desk, online booking platforms",
            tips: "Compare packages, read reviews, confirm inclusions, book through reliable sources",
          },
        ],
        appServices: [
          {
            name: "Ola Cabs",
            description:
              "Popular Indian cab service with multiple vehicle options",
            costEstimate: "₹50 base + ₹13/km + ₹7/minute",
            availability: "24/7 service across major cities",
            bookingMethod:
              "Download Ola app, create account, add payment method, book ride",
            vehicleTypes: [
              "Ola Micro",
              "Ola Mini",
              "Ola Prime Sedan",
              "Ola XL",
            ],
          },
          {
            name: "Uber",
            description: "Global ride-sharing platform with reliable service",
            costEstimate: "₹45 base + ₹12/km + ₹6/minute",
            availability: "24/7 service in metro and major cities",
            bookingMethod:
              "Download Uber app, verify account, add payment method, request ride",
            vehicleTypes: [
              "Uber Go",
              "Uber Comfort",
              "Uber Premier",
              "Uber XL",
            ],
          },
        ],
        airportTransfers: [
          {
            name: "Airport Taxi Pre-booking",
            type: "Advance booked airport transfers",
            description:
              "Reliable pre-booked taxi services from airport to city",
            costRange: "₹800-1500 depending on destination area",
            bookingMethod:
              "Book through airport counter, hotel concierge, or online platforms",
          },
          {
            name: "App-based Airport Services",
            type: "Special airport pickup/drop services",
            description: "Dedicated airport services through ride-sharing apps",
            costRange: "₹600-1200 with fixed airport pricing",
            bookingMethod:
              "Select airport option in Ola/Uber apps, fixed fare displayed upfront",
          },
        ],
        tips: [
          "Always negotiate auto-rickshaw fares or insist on meter usage",
          "Keep small denominations for bus and auto payments",
          "Use app-based services for transparent pricing and safety",
          "Share trip details with family/friends for longer journeys",
          "Carry hotel business card with address for taxi drivers",
          "Check transport options availability based on your accommodation location",
          "Consider local transport cards for regular city travel",
          "Plan ahead for peak hour traffic and delays",
        ],
      },
      tripOverview: transformedInput,
    };
  }
}

module.exports = new AIService();
