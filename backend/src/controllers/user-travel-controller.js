const TravelPlan = require("../models/TravelPlan");

class UserTravelController {
  // Save travel plan for authenticated user
  async saveTravelPlan(req, res) {
    try {
      const {
        destination,
        startDate,
        endDate,
        budget,
        interests,
        tripType,
        accommodation,
        planData,
      } = req.body;
      const userId = req.user.userId;

      if (
        !destination ||
        !startDate ||
        !endDate ||
        !budget ||
        !tripType ||
        !planData
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const newTravelPlan = new TravelPlan({
        userId,
        destination,
        startDate,
        endDate,
        budget,
        interests: interests || [],
        tripType,
        accommodation: accommodation || "Not specified",
        planData,
      });

      await newTravelPlan.save();

      res.status(201).json({
        success: true,
        message: "Travel plan saved successfully",
        plan: newTravelPlan,
      });
    } catch (error) {
      console.error("Error saving travel plan:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save travel plan",
      });
    }
  }

  // Get all travel plans for authenticated user
  async getUserTravelPlans(req, res) {
    try {
      const userId = req.user.userId;
      const userTravelPlans = await TravelPlan.find({ userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        plans: userTravelPlans,
      });
    } catch (error) {
      console.error("Error fetching travel plans:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch travel plans",
      });
    }
  }

  // Update travel plan for authenticated user
  async updateTravelPlan(req, res) {
    try {
      const { planId } = req.params;
      const { planData } = req.body;
      const userId = req.user.userId;

      const travelPlan = await TravelPlan.findOne({ _id: planId, userId });

      if (!travelPlan) {
        return res.status(404).json({
          success: false,
          message: "Travel plan not found",
        });
      }

      if (planData) {
        travelPlan.planData = planData;
        travelPlan.updatedAt = new Date();
        await travelPlan.save();
      }

      res.status(200).json({
        success: true,
        message: "Travel plan updated successfully",
        plan: travelPlan,
      });
    } catch (error) {
      console.error("Error updating travel plan:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update travel plan",
      });
    }
  }

  // Delete travel plan for authenticated user
  async deleteTravelPlan(req, res) {
    try {
      const { planId } = req.params;
      const userId = req.user.userId;

      const deletedPlan = await TravelPlan.findOneAndDelete({
        _id: planId,
        userId,
      });

      if (!deletedPlan) {
        return res.status(404).json({
          success: false,
          message: "Travel plan not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Travel plan deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting travel plan:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete travel plan",
      });
    }
  }
}

module.exports = new UserTravelController();

