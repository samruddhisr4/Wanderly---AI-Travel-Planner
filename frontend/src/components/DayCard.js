import React from "react";
import "./DayCard.css";

const DayCard = ({ dayData, isSelected }) => {
  if (!dayData) return null;

  const formatTime = (timeString) => {
    if (!timeString) return "";
    // Simple time formatting - can be enhanced based on actual time format
    return timeString.replace(/:00$/, "").toLowerCase();
  };

  const getCategoryIcon = (category) => {
    const icons = {
      sightseeing: "🏛️",
      food: "🍽️",
      transport: "🚗",
      accommodation: "🏨",
      activity: "🎉",
      culture: "🎭",
      nature: "🌳",
      shopping: "🛍️",
    };
    return icons[category?.toLowerCase()] || "📍";
  };

  return (
    <div className={`day-card ${isSelected ? "selected" : ""}`}>
      <div className="day-header">
        <h3>
          Day {dayData.dayNumber} - {dayData.date}
        </h3>
        {dayData.weather && (
          <div className="weather-info">🌤️ {dayData.weather}</div>
        )}
      </div>

      {dayData.notes && (
        <div className="day-notes">
          <p>{dayData.notes}</p>
        </div>
      )}

      {/* Activities Section */}
      {dayData.activities && dayData.activities.length > 0 && (
        <div className="activities-section">
          <h4>Activities</h4>
          <div className="activities-list">
            {dayData.activities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-header">
                  <span className="activity-icon">
                    {getCategoryIcon(activity.category)}
                  </span>
                  <span className="activity-time">
                    {formatTime(activity.time)}
                  </span>
                  {activity.estimatedCost && (
                    <span className="activity-cost">
                      ${activity.estimatedCost}
                    </span>
                  )}
                </div>
                <div className="activity-content">
                  <h5>{activity.title}</h5>
                  <p>{activity.description}</p>
                  {activity.duration && (
                    <span className="activity-duration">
                      Duration: {activity.duration}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meals Section */}
      {dayData.meals && dayData.meals.length > 0 && (
        <div className="meals-section">
          <h4>Meals</h4>
          <div className="meals-list">
            {dayData.meals.map((meal, index) => (
              <div key={index} className="meal-item">
                <div className="meal-header">
                  <span className="meal-time">{formatTime(meal.time)}</span>
                  <span className="meal-type">{meal.type}</span>
                  {meal.estimatedCost && (
                    <span className="meal-cost">${meal.estimatedCost}</span>
                  )}
                </div>
                <div className="meal-content">
                  <h5>{meal.recommendation}</h5>
                  {meal.cuisineType && (
                    <span className="cuisine-type">{meal.cuisineType}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accommodation Section */}
      {dayData.accommodation && (
        <div className="accommodation-section">
          <h4>Accommodation</h4>
          <div className="accommodation-card">
            <div className="accommodation-header">
              <h5>{dayData.accommodation.name}</h5>
              <span className="accommodation-type">
                {dayData.accommodation.type}
              </span>
            </div>
            <div className="accommodation-details">
              <p className="location">📍 {dayData.accommodation.location}</p>
              {dayData.accommodation.rating && (
                <div className="rating">
                  {"★".repeat(Math.floor(dayData.accommodation.rating))}
                  {"☆".repeat(5 - Math.floor(dayData.accommodation.rating))}
                  <span>({dayData.accommodation.rating})</span>
                </div>
              )}
              {dayData.accommodation.estimatedCost && (
                <p className="cost">
                  Cost: ${dayData.accommodation.estimatedCost}/night
                </p>
              )}
            </div>
            {dayData.accommodation.notes && (
              <div className="accommodation-notes">
                <p>{dayData.accommodation.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transportation Section */}
      {dayData.transportation && (
        <div className="transportation-section">
          <h4>Transportation</h4>
          <div className="transportation-info">
            <p>
              <strong>Mode:</strong> {dayData.transportation.mode}
            </p>
            {dayData.transportation.estimatedCost && (
              <p>
                <strong>Estimated Cost:</strong> $
                {dayData.transportation.estimatedCost}
              </p>
            )}
            {dayData.transportation.notes && (
              <p className="transport-notes">{dayData.transportation.notes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DayCard;
