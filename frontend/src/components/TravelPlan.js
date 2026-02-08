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
              title="Copy Full Itinerary"
              style={{
                padding: '8px',
                background: 'none',
                color: 'black',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: 'none'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              🗒
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
      {/* Meals and Accommodation sections removed from here - now on separate pages */}

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
