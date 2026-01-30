import React from "react";

const TravelPlan = ({ plan }) => {
  if (!plan) return null;

  const { tripOverview, budgetBreakdown, dailyItinerary, safetyNotes } = plan;

  return (
    <div className="plan-result">
      <h2>Your Travel Plan for {tripOverview.destination}</h2>

      <div className="trip-overview">
        <h3>Trip Overview</h3>
        <p>
          <strong>Duration:</strong> {tripOverview.duration} days
        </p>
        <p>
          <strong>Travel Style:</strong> {tripOverview.travelStyle}
        </p>
        <p>
          <strong>Total Budget:</strong> ₹{tripOverview.totalBudget}
        </p>
      </div>

      <div className="budget-breakdown">
        <h3>Budget Breakdown</h3>
        <div className="budget-item">
          <h4>Accommodation</h4>
          <p>₹{budgetBreakdown.stay.amount}</p>
          <small>{budgetBreakdown.stay.description}</small>
        </div>
        <div className="budget-item">
          <h4>Food</h4>
          <p>₹{budgetBreakdown.food.amount}</p>
          <small>{budgetBreakdown.food.description}</small>
        </div>
        <div className="budget-item">
          <h4>Transport</h4>
          <p>₹{budgetBreakdown.transport.amount}</p>
          <small>{budgetBreakdown.transport.description}</small>
        </div>
        <div className="budget-item">
          <h4>Activities</h4>
          <p>₹{budgetBreakdown.activities.amount}</p>
          <small>{budgetBreakdown.activities.description}</small>
        </div>
        <div className="budget-item">
          <h4>Contingency</h4>
          <p>₹{budgetBreakdown.contingency.amount}</p>
          <small>{budgetBreakdown.contingency.description}</small>
        </div>
      </div>

      <div className="daily-itinerary">
        <h3>Daily Itinerary</h3>
        {dailyItinerary.map((day, index) => (
          <div key={index} className="day-card">
            <h4>
              Day {day.day} - {day.date}
            </h4>
            <p>
              <strong>Activities:</strong>
            </p>
            <ul>
              {day.activities.map((activity, actIndex) => (
                <li key={actIndex}>{activity}</li>
              ))}
            </ul>
            <p>
              <strong>Meals:</strong>
            </p>
            <ul>
              {day.meals.map((meal, mealIndex) => (
                <li key={mealIndex}>{meal}</li>
              ))}
            </ul>
            <p>
              <strong>Accommodation:</strong> {day.accommodation}
            </p>
            <p>
              <strong>Notes:</strong> {day.notes}
            </p>
          </div>
        ))}
      </div>

      {safetyNotes && (
        <div className="safety-notes">
          <h3>Important Safety Information</h3>
          <p>{safetyNotes}</p>
        </div>
      )}
    </div>
  );
};

export default TravelPlan;
