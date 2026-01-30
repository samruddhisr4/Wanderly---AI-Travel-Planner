// Safety Service - Responsible handling of women safety information
// Ethical AI principles: factual, non-alarmist, inclusive, and transparent

class SafetyService {
  constructor() {
    // Official women's helpline numbers by country (sourced from government/official sources)
    this.womenHelplines = {
      "united states": {
        number: "1-800-799-7233",
        service: "National Domestic Violence Hotline",
        website: "thehotline.org",
        notes: "Available 24/7, multilingual support",
      },
      "united kingdom": {
        number: "0808 2000 247",
        service: "National Domestic Abuse Helpline",
        website: "womensaid.org.uk",
        notes: "24/7 service, free and confidential",
      },
      canada: {
        number: "1-866-293-4483",
        service: "Assaulted Women's Helpline",
        website: "awhl.org",
        notes: "24/7 crisis support line",
      },
      australia: {
        number: "1800 737 732",
        service:
          "National Sexual Assault, Family & Domestic Violence Counselling Line",
        website: "1800respect.org.au",
        notes: "24/7 service, available in multiple languages",
      },
      india: {
        number: "181",
        service: "Women Helpline (Ministry of Women & Child Development)",
        website: "wcd.nic.in",
        notes: "24/7 service, police assistance",
      },
      france: {
        number: "3919",
        service: "National Helpline for Women Victims of Violence",
        website: "arcs-info.org",
        notes: "Free service, available 24/7",
      },
      germany: {
        number: "08000 116 016",
        service: "National Domestic Violence Hotline",
        website: "hilfetelefon.de",
        notes: "Free, anonymous, 24/7 support",
      },
      brazil: {
        number: "180",
        service: "National Women's Helpline",
        website: "gov.br/mdh",
        notes: "24/7 service, government-run",
      },
    };

    // General safety guidelines that apply universally
    this.generalSafetyGuidelines = {
      urban: [
        "Stay in well-lit, populated areas, especially after dark",
        "Use reputable transportation services with licensed drivers",
        "Keep emergency contacts easily accessible",
        "Share your daily itinerary with trusted contacts",
        "Research neighborhoods in advance using official tourism resources",
        "Trust your instincts - if something feels wrong, remove yourself from the situation",
      ],
      accommodation: [
        "Choose accommodations in central, well-reviewed locations",
        "Verify 24/7 front desk service and security measures",
        "Check reviews specifically mentioning safety and female travelers",
        "Ensure good lighting around entrances and common areas",
        "Confirm secure room locks and safe storage options",
      ],
      transportation: [
        "Use official taxis or ride-sharing services with verified drivers",
        "Avoid unmarked or unofficial transportation",
        "Keep copies of important documents in secure locations",
        "Stay alert during transit, especially at night",
        "Have backup transportation plans for emergencies",
      ],
    };

    // Countries requiring special safety considerations (factual, non-alarmist)
    this.specialConsiderations = {
      egypt: {
        conservative: true,
        dress: "Modest clothing recommended, especially in religious sites",
        areas: ["Downtown Cairo", "Giza", "Alexandria"],
        note: "Generally safe for women in tourist areas with standard precautions",
      },
      turkey: {
        conservative: true,
        dress: "Shoulder and knee coverage recommended in religious areas",
        areas: ["Istanbul Old City", "Cappadocia", "Coastal resorts"],
        note: "Tourist destinations are generally safe with normal precautions",
      },
      morocco: {
        conservative: true,
        dress: "Modest dress advised, particularly outside major tourist areas",
        areas: ["Marrakech medina", "Casablanca", "Coastal cities"],
        note: "Well-established tourist infrastructure with standard safety measures",
      },
    };
  }

  // Extract country from destination string
  extractCountry(destination) {
    const countryMap = {
      paris: "france",
      london: "united kingdom",
      "new york": "united states",
      "los angeles": "united states",
      toronto: "canada",
      sydney: "australia",
      melbourne: "australia",
      mumbai: "india",
      delhi: "india",
      berlin: "germany",
      munich: "germany",
      "rio de janeiro": "brazil",
      "sao paulo": "brazil",
      cairo: "egypt",
      istanbul: "turkey",
      marrakech: "morocco",
      casablanca: "morocco",
    };

    const lowerDest = destination.toLowerCase();

    // Check direct mapping first
    for (const [city, country] of Object.entries(countryMap)) {
      if (lowerDest.includes(city)) {
        return country;
      }
    }

    // Extract country name if present in format "City, Country"
    const parts = destination
      .split(",")
      .map((part) => part.trim().toLowerCase());
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }

    return null;
  }

  // Get helpline information for a country
  getHelplineInfo(country) {
    if (!country) return null;

    const lowerCountry = country.toLowerCase();
    return this.womenHelplines[lowerCountry] || null;
  }

  // Generate responsible safety recommendations
  generateSafetyRecommendations(destination, travelType, isSoloTraveler) {
    const country = this.extractCountry(destination);
    const helplineInfo = this.getHelplineInfo(country);
    const recommendations = [];

    // Always include general safety guidelines
    recommendations.push(...this.generalSafetyGuidelines.urban);
    recommendations.push(...this.generalSafetyGuidelines.accommodation);
    recommendations.push(...this.generalSafetyGuidelines.transportation);

    // Add country-specific considerations if available
    if (country && this.specialConsiderations[country.toLowerCase()]) {
      const countryInfo = this.specialConsiderations[country.toLowerCase()];
      if (countryInfo.conservative) {
        recommendations.push(countryInfo.dress);
      }
      recommendations.push(
        `Recommended areas: ${countryInfo.areas.join(", ")}`
      );
      recommendations.push(countryInfo.note);
    }

    // Add helpline information if available
    if (helplineInfo) {
      recommendations.push(
        `Local women's helpline: ${helplineInfo.number} (${helplineInfo.service})`
      );
      if (helplineInfo.website) {
        recommendations.push(`Website: ${helplineInfo.website}`);
      }
      if (helplineInfo.notes) {
        recommendations.push(helplineInfo.notes);
      }
    } else {
      recommendations.push(
        "Research local emergency numbers and women's support services before travel"
      );
    }

    // Solo traveler specific guidance
    if (isSoloTraveler) {
      recommendations.push(
        "As a solo traveler, consider joining group activities or tours for added security"
      );
      recommendations.push(
        "Stay in accommodations with 24/7 reception and good reviews from other solo female travelers"
      );
      recommendations.push(
        "Regular check-ins with family/friends are recommended"
      );
    }

    return recommendations;
  }

  // Handle missing or uncertain safety data responsibly
  handleUncertainData(destination, country) {
    const disclaimer = [
      "Safety information is based on general travel guidelines and may not reflect current local conditions.",
      "Always check current government travel advisories before departure.",
      "Local conditions can change rapidly - stay informed through official sources.",
      "This information is provided as general guidance only, not as professional security advice.",
    ];

    if (!country) {
      return [
        `For ${destination}: General safety precautions apply.`,
        ...disclaimer,
        "Research the specific region using official government travel advisories.",
        "Connect with local tourism boards for current safety information.",
      ];
    }

    return [
      `For ${destination}: Standard travel safety measures recommended.`,
      ...disclaimer,
      `Consider checking ${country}'s official government travel website for specific guidance.`,
      "Local tourism authorities can provide current safety recommendations.",
    ];
  }

  // Main safety note generation method
  generateSafetyNotes(destination, travelType = "general") {
    const isSoloTraveler = travelType === "solo" || travelType === "female";
    const country = this.extractCountry(destination);

    try {
      const recommendations = this.generateSafetyRecommendations(
        destination,
        travelType,
        isSoloTraveler
      );

      // Format the safety notes in a clear, non-alarmist way
      let safetyNote = `Safety Guidelines for ${destination}:\n\n`;

      recommendations.forEach((rec, index) => {
        safetyNote += `${index + 1}. ${rec}\n`;
      });

      // Add ethical disclaimer
      safetyNote +=
        "\nNote: These are general safety guidelines. Local conditions may vary. ";
      safetyNote +=
        "Always verify current information through official sources before travel.";

      return safetyNote;
    } catch (error) {
      // Handle errors gracefully with responsible fallback
      console.warn(`Safety service error for ${destination}:`, error.message);
      return this.handleUncertainData(destination, country).join("\n");
    }
  }
}

module.exports = new SafetyService();
