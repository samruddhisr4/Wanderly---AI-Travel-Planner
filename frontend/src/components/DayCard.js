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

  const parseAndFormatUrl = (url, context = "") => {
    // If it's already a valid URL, use it
    try {
      new URL(url);
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="view-on-maps-btn">
          View on Maps
        </a>
      );
    } catch {
      // If not a URL, treat it as a search query
      // Combine the location name/address with any context (like city/destination)
      const searchQuery = context ? `${url} ${context}` : url;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;

      return (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="view-on-maps-btn">
          View on Maps
        </a>
      );
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
                          {parseAndFormatUrl(activity.location, dayData.destination)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meals and Accommodation removed from DayCard as they have dedicated pages */}
        </>
      )}
    </div>
  );
};

export default DayCard;

