import React, { useState } from "react";
import "./DayCard.css";

const DayCard = ({
  dayData,
  isSelected,
}) => {
  const [isExpanded, setIsExpanded] = useState(dayData?.dayNumber === 1);

  if (!dayData) return null;

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.replace(/:00$/, "").toLowerCase();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const parseAndFormatUrl = (url) => {
    try {
      new URL(url);
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="view-on-maps-btn">
          View on Maps
        </a>
      );
    } catch {
      return url;
    }
  };

  const handleShareDay = (e) => {
    e.stopPropagation();
    let text = `Day ${dayData.dayNumber} - ${dayData.date}\n\n`;
    dayData.activities.forEach(act => {
      text += `${act.time}: ${act.title}\n${act.description}\n\n`;
    });
    navigator.clipboard.writeText(text).then(() => alert("Day itinerary copied!"));
  };

  return (
    <div className={`day-card ${isSelected ? "selected" : ""}`}>
      <div
        className="day-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer" }}
      >
        <div className="day-title">
          <h3>
            Day {dayData.dayNumber} - {dayData.date}
          </h3>
          <span className="expand-indicator">{isExpanded ? "▼" : "▶"}</span>
        </div>

        <div className="day-header-actions">
          <button className="share-icon-btn" onClick={handleShareDay} title="Share Day">
            🗒
          </button>
          {dayData.weather && (
            <div className="weather-info">{dayData.weather}</div>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          {dayData.notes && (
            <div className="day-notes">
              <p>{dayData.notes}</p>
            </div>
          )}

          {/* Activities Section - Static List without Icons */}
          {dayData.activities && dayData.activities.length > 0 && (
            <div className="activities-section">
              <h4>Activities</h4>

              <div className="activities-list">
                {dayData.activities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-header">
                      {activity.time && (
                        <span className="activity-time">
                          {formatTime(activity.time)}
                        </span>
                      )}
                      {activity.cost && (
                        <span className="activity-cost">
                          {formatCurrency(activity.cost)}
                        </span>
                      )}
                    </div>
                    <div className="activity-content">
                      <h5>{activity.title}</h5>
                      <p>{activity.description}</p>

                      <div className="activity-details-row">
                        {activity.openingHours && (
                          <span className="detail-badge hours">
                            {activity.openingHours}
                          </span>
                        )}
                        {activity.entryFee !== undefined && activity.entryFee > 0 && (
                          <span className="detail-badge fee">
                            Entry: {formatCurrency(activity.entryFee)}
                          </span>
                        )}
                        {activity.duration && (
                          <span className="detail-badge duration">
                            {activity.duration}
                          </span>
                        )}
                      </div>

                      {activity.location && (
                        <div className="location-link">
                          {parseAndFormatUrl(activity.location)}
                        </div>
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
                      {meal.time && (
                        <span className="meal-time">{formatTime(meal.time)}</span>
                      )}
                      <span className="meal-type">{meal.type}</span>
                      {meal.cost && (
                        <span className="meal-cost">
                          {formatCurrency(meal.cost)}
                        </span>
                      )}
                    </div>
                    <div className="meal-content">
                      <h5>{meal.recommendation}</h5>
                      <span className="cuisine-type">{meal.cuisineType}</span>
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
                  <p className="location">
                    {dayData.accommodation.location}
                  </p>
                  {/* ... (keep existing simple accommodation rendering) ... */}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DayCard;

