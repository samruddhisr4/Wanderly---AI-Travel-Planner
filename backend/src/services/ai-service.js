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
    this.travelTypes = ["solo", "couple", "family", "friends", "business"];

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
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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

    return {
      destination: normalizedDestination,
      fullDestination: destination.trim(),
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      duration,
      budget: Number(budget),
      travelStyle,
      travelType: travelType || "general",
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

    // Build the enhanced prompt with detailed requirements
    let prompt = "";
    prompt +=
      "You are an expert AI Travel Planning Assistant. Generate a comprehensive, detailed travel plan with specific locations, real tourist spots, and exact restaurant recommendations.\n\n";
    prompt += "Destination: " + destination + "\n";
    prompt +=
      "Trip Duration: " +
      duration +
      " days (" +
      startDate +
      " to " +
      endDate +
      ")\n";
    prompt += "Travel Type: " + travelType + "\n";
    prompt += "Budget: " + budget + " INR (Indian Rupees)\n";
    prompt +=
      "Travel Style: " + travelStyle + " - " + styleConfig.description + "\n";
    prompt += constraintText;
    prompt += "\nCRITICAL REQUIREMENTS:\n";
    prompt += "1. LOCATION-BASED PLANNING:\n";
    prompt +=
      "   - Group nearby attractions together in same day (max 30-45 minutes travel between spots)\n";
    prompt += "   - Start each day with centrally located attractions\n";
    prompt += "   - End days near accommodation area\n";
    prompt +=
      "   - Include actual distances and travel times between locations\n\n";
    prompt += "2. SPECIFIC TOURIST SPOTS:\n";
    prompt += "   - Name exact monuments, museums, markets, and landmarks\n";
    prompt += "   - Include entry fees and visiting hours\n";
    prompt += "   - Mention historical significance and must-see features\n";
    prompt +=
      "   - Suggest best times to visit (avoid crowds, photography timing)\n\n";
    prompt += "3. DETAILED DINING:\n";
    prompt +=
      "   - Provide 3-4 restaurant options for each meal (breakfast, lunch, dinner)\n";
    prompt += "   - Include approximate costs per person for each option\n";
    prompt += "   - Mention cuisine type, specialities, and unique features\n";
    prompt += "   - Provide working Google Maps links for each restaurant\n";
    prompt += "   - Suggest local street food options with safety notes\n";
    prompt += "   - Include vegetarian/vegan options where available\n\n";
    prompt += "4. TRANSPORTATION:\n";
    prompt +=
      "   - Recommend local transport options (metro, bus, taxi, auto-rickshaw)\n";
    prompt += "   - Include approximate costs and travel times\n";
    prompt +=
      "   - Mention app recommendations (Ola, Uber, local transit apps)\n\n";
    prompt += "5. ACCOMMODATION:\n";
    prompt +=
      "   - Suggest 3-4 hotel/guesthouse options with different price ranges.Include proper hotels if family is involved and hostels or shared living if solo traveller\n";
    prompt +=
      "   - Include price ranges, booking platforms, and contact details\n";
    prompt +=
      "   - Mention key amenities, location benefits, and unique features\n";
    prompt += "   - Provide working Google Maps links for each accommodation\n";
    prompt +=
      "   - Include options for different budgets (budget, mid-range, luxury)\n\n";
    prompt += "6. BUDGET BREAKDOWN:\n";
    prompt += "   - Use INR (Indian Rupees) for all amounts\n";
    prompt += "   - Include realistic pricing for " + destination + "\n";
    prompt += "   - Account for currency conversion if needed\n\n";
    prompt += "7. SAFETY & PRACTICAL INFO:\n";
    prompt += "   - Include women-specific safety information\n";
    prompt += "   - Mention local customs and etiquette\n";
    prompt += "   - Provide emergency contact numbers\n\n";
    prompt += "8. DAILY STRUCTURE:\n";
    prompt +=
      "   - " +
      styleConfig.activitiesPerDay +
      " main activities per day maximum\n";
    prompt += "   - Include buffer time between activities\n";
    prompt += "   - Balance popular spots with local experiences\n";
    prompt += "   - Consider opening/closing times of attractions\n\n";
    prompt += "OUTPUT FORMAT (JSON):\n";
    prompt += "{\n";
    prompt += '  "tripOverview": {\n';
    prompt += '    "destination": "' + destination + '",\n';
    prompt += '    "duration": ' + duration + ",\n";
    prompt += '    "travelStyle": "' + travelStyle + '",\n';
    prompt += '    "travelType": "' + travelType + '",\n';
    prompt += '    "totalBudget": ' + budget + ",\n";
    prompt += '    "currency": "INR"\n';
    prompt += "  },\n";
    prompt += '  "budgetBreakdown": {\n';
    prompt += '    "stay": { "amount": number, "description": "string" },\n';
    prompt += '    "food": { "amount": number, "description": "string" },\n';
    prompt +=
      '    "transport": { "amount": number, "description": "string" },\n';
    prompt +=
      '    "activities": { "amount": number, "description": "string" },\n';
    prompt +=
      '    "contingency": { "amount": number, "description": "string" }\n';
    prompt += "  },\n";
    prompt += '  "dailyItinerary": [\n';
    prompt += "    {\n";
    prompt += '      "day": 1,\n';
    prompt += '      "date": "2026-03-27",\n';
    prompt += '      "activities": [\n';
    prompt +=
      '        "Morning (9:00-12:00): Visit [Specific Monument Name] - [Historical significance and key features]",\n';
    prompt +=
      '        "Afternoon (12:30-15:30): Explore [Specific Museum/Attraction] - [Entry fee and highlights]",\n';
    prompt +=
      '        "Evening (17:00-19:00): [Specific Local Experience] - [Cultural significance]"\n';
    prompt += "      ],\n";
    prompt += '      "meals": [\n';
    prompt += '        "Breakfast: [Specific Café Name] (₹150 per person)",\n';
    prompt +=
      '        "Lunch: [Specific Restaurant Name] - [Cuisine type] - Cost per person and its google link",\n';
    prompt +=
      '        "Dinner: [Specific Restaurant Name] - [Speciality] - Cost per person and its google link"\n';
    prompt += "      ],\n";
    prompt +=
      '      "accommodation": "[Specific Hotel Name] - [Key features]  - Cost per person and its google link",\n';
    prompt +=
      '      "transport": "[Specific transport options with costs and travel times]",\n';
    prompt += '      "notes": "[Practical tips and recommendations]"\n';
    prompt += "    }\n";
    prompt += "  ],\n";
    prompt +=
      '  "safetyNotes": "[Destination-specific safety information with emergency contacts]"\n';
    prompt += "}\n\n";
    prompt +=
      "IMPORTANT: Provide real, specific information for " +
      destination +
      ". Include actual restaurant names, real tourist attractions, and genuine pricing. Make each day unique with different experiences.";

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

        // Ensure the response has the required structure
        if (
          !aiResponse.tripOverview ||
          !aiResponse.budgetBreakdown ||
          !aiResponse.dailyItinerary
        ) {
          throw new Error("Incomplete response structure from AI service");
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
        console.warn(
          "OpenAI service failed, falling back to mock response:",
          aiError.message
        );

        // Fallback to mock response if AI service fails
        return {
          tripOverview: {
            destination: transformedInput.fullDestination,
            duration: transformedInput.duration,
            travelStyle: transformedInput.travelStyle,
            travelType: transformedInput.travelType,
            totalBudget: transformedInput.budget,
          },
          budgetBreakdown: {
            stay: {
              amount: Math.round(transformedInput.budget * 0.4),
              description: "Mid-range accommodation for the trip duration",
            },
            food: {
              amount: Math.round(transformedInput.budget * 0.25),
              description: "Local restaurants and street food",
            },
            transport: {
              amount: Math.round(transformedInput.budget * 0.15),
              description: "Public transport and local travel",
            },
            activities: {
              amount: Math.round(transformedInput.budget * 0.15),
              description: "Entrance fees and activities",
            },
            contingency: {
              amount: Math.round(transformedInput.budget * 0.05),
              description: "Emergency buffer",
            },
          },
          dailyItinerary: this.generateMockItinerary(
            transformedInput.duration,
            transformedInput.travelStyle,
            transformedInput.constraints,
            transformedInput.fullDestination
          ),
          safetyNotes: this.generateSafetyNotes(
            transformedInput.fullDestination,
            transformedInput.travelType
          ),
        };
      }
    } catch (error) {
      throw new Error("Failed to generate travel plan: " + error.message);
    }
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
