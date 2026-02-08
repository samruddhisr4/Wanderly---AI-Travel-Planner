import React from "react";
import TravelPlanWithDayCards from "./TravelPlanWithDayCards";

const TravelPlan = ({ plan, onComponentGenerate, loadingComponent, user, onUpdatePlan }) => {
  if (!plan) return null;

  const handleShareItinerary = () => {
    const text = `Travel Plan for ${plan.tripOverview?.destination}\n` +
      `Dates: ${plan.tripOverview?.duration} days\n\n` +
      plan.dailyItinerary.map(day =>
        `Day ${day.day}: ${day.date}\n` +
        (day.activities || []).map(act => `- ${act.time || ''} ${act.title || act}`).join('\n')
      ).join('\n\n');

    navigator.clipboard.writeText(text).then(() => alert("Full itinerary copied to clipboard!"));
  };

  const {
    tripOverview,
    budgetBreakdown,
    dailyItinerary,
    safetyNotes,
    meals,
    accommodation,
    transport,
  } = plan;

  return (
    <div className="plan-result">
      {tripOverview && (
        <div className="trip-overview-section">
          <div className="overview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>
              Your Travel Plan for{" "}
              {tripOverview.fullDestination || tripOverview.destination}
            </h2>
            <button
              onClick={handleShareItinerary}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Share Itinerary 📤
            </button>
          </div>
          <div className="trip-overview">
            <h3>Trip Overview</h3>
            <p>
              <strong>Duration:</strong> {tripOverview.duration || 0} days
            </p>
            <p>
              <strong>Travel Style:</strong> {tripOverview.travelStyle || "N/A"}
            </p>
            <p>
              <strong>Total Budget:</strong> ₹
              {tripOverview.budget || tripOverview.totalBudget || 0}
            </p>
          </div>
        </div>
      )}

      {/* Day cards with per-day generation buttons */}
      {/* Day cards with per-day generation buttons */}
      <TravelPlanWithDayCards
        plan={plan}
        onComponentGenerate={onComponentGenerate}
        loadingComponent={loadingComponent}
        onUpdatePlan={onUpdatePlan}
      />

      {/* Keep other sections (meals/global, accommodation, transport, budget, safety) as before */}
      {!dailyItinerary &&
        meals &&
        (meals.breakfast || meals.lunch || meals.dinner) && (
          <div className="meals-section">
            <h3>Meal Recommendations</h3>
            {/* render simplified meal lists */}
            {meals.breakfast &&
              Array.isArray(meals.breakfast) &&
              meals.breakfast.length > 0 && (
                <div className="meal-type">
                  <h4>Breakfast Options ({meals.breakfast.length} options)</h4>
                  {meals.breakfast.map((item, idx) => (
                    <div key={idx} className="meal-item">
                      <strong>{item.name}</strong> - {item.cuisine} •{" "}
                      {item.priceRange}
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

      {accommodation && accommodation.length > 0 && (
        <div className="accommodation-section">
          <h3>Accommodation Options ({accommodation.length} options)</h3>
          {accommodation.map((item, idx) => (
            <div key={idx} className="accommodation-item">
              <h4>{item.name}</h4>
              <p>
                <strong>Price Range:</strong> {item.priceRange}
              </p>
            </div>
          ))}
        </div>
      )}

      {transport && (
        <div className="transport-section">
          <h3>Transportation Options</h3>
          {/* simplified transport rendering */}
          {transport.localOptions && transport.localOptions.length > 0 && (
            <div className="transport-type">
              <h4>
                Local Transportation ({transport.localOptions.length} options)
              </h4>
              {transport.localOptions.map((item, idx) => (
                <div key={idx} className="transport-item">
                  <h5>
                    {item.name} - {item.type}
                  </h5>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {budgetBreakdown && (
        <div className="budget-breakdown-section">
          <h3>Budget Breakdown</h3>
          <div className="budget-item">
            <h4>Accommodation</h4>
            <p>₹{budgetBreakdown.stay?.amount || 0}</p>
          </div>
        </div>
      )}

      {safetyNotes && (
        <div className="safety-notes-section">
          <h3>Important Safety Information</h3>
          <p>{safetyNotes}</p>
        </div>
      )}
    </div>
  );
};

export default TravelPlan;
