// OpenAI Service - Handles OpenAI API integration for travel planning
const OpenAI = require("openai");

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Model configuration
    this.model = "gpt-3.5-turbo";
    this.temperature = 0.7;
    this.maxTokens = 4000;
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
              "You are an expert travel planner AI assistant. Generate detailed, realistic travel plans based on user inputs. Provide practical advice and realistic timelines.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: "json_object" },
      });

      let completion = response.choices[0].message.content;

      // Clean up the response if it contains markdown code blocks
      if (completion.startsWith("```json")) {
        completion = completion.substring(7); // Remove ```json
      }
      if (completion.endsWith("```")) {
        completion = completion.substring(0, completion.lastIndexOf("```")); // Remove trailing ```
      }

      // Attempt to fix common JSON issues
      try {
        // First, try parsing as-is
        return JSON.parse(completion);
      } catch (initialParseError) {
        // If that fails, try to fix common issues
        try {
          // Attempt to fix unterminated strings by finding the last complete object
          const fixedCompletion = this.fixTruncatedJSON(completion);
          if (fixedCompletion) {
            console.log("Successfully fixed truncated JSON");
            return JSON.parse(fixedCompletion);
          }
        } catch (fixError) {
          console.error("Failed to fix truncated JSON:", fixError);
        }

        console.error(
          "Failed to parse OpenAI response as JSON:",
          initialParseError
        );
        console.error("Raw response:", completion);
        throw new Error("Invalid response format from AI service");
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

  // Helper method to fix truncated JSON responses
  fixTruncatedJSON(str) {
    // Find the last complete object by counting braces
    let braceCount = 0;
    let lastCompleteIndex = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
          if (braceCount === 0) {
            lastCompleteIndex = i;
          }
        }
      }
    }

    if (lastCompleteIndex !== -1) {
      // Extract the complete JSON object
      const completeJson = str.substring(0, lastCompleteIndex + 1);

      // Try to fix the end by adding missing closing brackets if needed
      try {
        // Count how many arrays and objects were opened but not closed
        let result = completeJson;

        // Count opening vs closing brackets
        let objOpenings = (result.match(/\{/g) || []).length;
        let objClosings = (result.match(/\}/g) || []).length;
        let arrOpenings = (result.match(/\[/g) || []).length;
        let arrClosings = (result.match(/]/g) || []).length;

        // Close any unclosed objects and arrays
        for (let i = 0; i < objOpenings - objClosings; i++) {
          result += "}";
        }
        for (let i = 0; i < arrOpenings - arrClosings; i++) {
          result += "]";
        }

        // Also ensure the outer arrays and objects are closed properly
        try {
          JSON.parse(result);
          return result;
        } catch (e) {
          // If still not valid, try a simpler approach
          return completeJson;
        }
      } catch (e) {
        console.error("Error in fixing JSON:", e);
        return completeJson;
      }
    }

    return null; // Could not fix
  }

  // Test OpenAI connection
  async testConnection() {
    try {
      if (
        !process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === "your_openai_api_key_here"
      ) {
        return { success: false, error: "OpenAI API key not configured" };
      }

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: "Say hello!" }],
        max_tokens: 10,
      });

      return { success: true, message: "OpenAI connection successful" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new OpenAIService();
