// OpenAI Service - Handles OpenAI API integration for travel planning
const OpenAI = require("openai");

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Model configuration - using a more capable model
    this.model = "gpt-3.5-turbo"; // Changed to supported model
    this.temperature = 0.7; // Balanced creativity
    this.maxTokens = 2000; // Reduced for modular responses
  }

  // Generate travel plan using OpenAI
  async generateTravelPlan(prompt) {
    try {
      if (
        !process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === "your_openai_api_key_here"
      ) {
        throw new Error(
          "OpenAI API key not configured. Please add your API key to the .env file."
        );
      }

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert travel planner AI assistant. Generate detailed, realistic travel information based on user inputs. Focus on providing practical, helpful information. Return only valid JSON without markdown formatting or explanations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      let completion = response.choices[0].message.content;

      // Clean up the response
      completion = completion.trim();

      // Parse JSON response
      try {
        const parsedResponse = JSON.parse(completion);
        return parsedResponse;
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        console.log("Raw response:", completion);

        // Try to fix common JSON issues
        const fixedJson = this.fixCommonJsonIssues(completion);
        try {
          const parsedResponse = JSON.parse(fixedJson);
          console.log("Successfully parsed fixed JSON");
          return parsedResponse;
        } catch (fixedError) {
          console.error("Fixed JSON parsing also failed:", fixedError);
          throw new Error("Invalid JSON response from AI service");
        }
      }
    } catch (error) {
      console.error("OpenAI API Error:", error);

      if (error.message.includes("incorrect API key")) {
        throw new Error(
          "Invalid OpenAI API key. Please check your API key in the .env file."
        );
      }

      if (error.message.includes("rate limit")) {
        throw new Error("OpenAI rate limit exceeded. Please try again later.");
      }

      if (error.message.includes("insufficient_quota")) {
        throw new Error(
          "OpenAI API quota exceeded. Please check your billing details."
        );
      }

      throw new Error(`AI service error: ${error.message}`);
    }
  }

  // Helper method to fix common JSON issues
  fixCommonJsonIssues(str) {
    // 1. Extract JSON part if mixed with text
    const firstBrace = str.indexOf("{");
    const lastBrace = str.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      str = str.substring(firstBrace, lastBrace + 1);
    }

    // 2. Remove comments (// or /* */) 
    str = str.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

    // 3. Fix trailing commas in objects and arrays
    str = str.replace(/,(\s*[}\]])/g, '$1');

    // 4. Fix single quotes to double quotes for keys and values
    // This is tricky as we don't want to replace apostrophes in text
    // Only replace single quotes that look like JSON delimiters
    str = str.replace(/'([^']+)'\s*:/g, '"$1":'); // Keys
    str = str.replace(/:\s*'([^']+)'/g, ': "$1"'); // Simple string values

    // 5. Quote unquoted keys (e.g., key: "value" -> "key": "value")
    str = str.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

    return str;
  }

  // Test OpenAI connection
  async testConnection() {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message.",
          },
        ],
        max_tokens: 10,
      });

      return {
        success: true,
        model: response.model,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new OpenAIService();