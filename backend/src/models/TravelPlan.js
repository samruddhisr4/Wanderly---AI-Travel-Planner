const mongoose = require("mongoose");

const travelPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  budget: {
    type: String,
    required: true,
  },
  interests: [
    {
      type: String,
    },
  ],
  tripType: {
    type: String,
    required: true,
  },
  accommodation: {
    type: String,
  },
  planData: {
    type: mongoose.Schema.Types.Mixed, // Store the complete travel plan data
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
travelPlanSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("TravelPlan", travelPlanSchema);
