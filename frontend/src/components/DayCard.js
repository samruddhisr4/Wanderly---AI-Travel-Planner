import React, { useState } from "react";
import "./DayCard.css";

const DayCard = ({
  dayData,
  isSelected,
  onGenerateMeal,
  onGenerateAccommodation,
  onGenerateTransport,
  loadingComponent,
}) => {
  const [isExpanded, setIsExpanded] = useState(dayData?.dayNumber === 1); // Auto-expand Day 1

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Parse activities into morning/afternoon/evening groups
  const groupActivitiesByTime = (activities) => {
    const groups = { morning: [], afternoon: [], evening: [] };

    activities.forEach((activity) => {
      const time = activity.time?.toLowerCase() || "";
      if (time.includes("morning") || time.includes("am")) {
        groups.morning.push(activity);
      } else if (
        time.includes("afternoon") ||
        (time.includes("pm") && !time.includes("evening"))
      ) {
        groups.afternoon.push(activity);
      } else if (time.includes("evening") || time.includes("pm")) {
        groups.evening.push(activity);
      } else {
        // If no specific time, put in afternoon as default
        groups.afternoon.push(activity);
      }
    });

    return groups;
  };

  const parseAndFormatUrl = (url) => {
    try {
      new URL(url); // Validate URL
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-on-maps-btn"
        >
          View on Maps
        </a>
      );
    } catch {
      return url; // Return as-is if it's not a valid URL
    }
  };

  const timeGroups = dayData.activities
    ? groupActivitiesByTime(dayData.activities)
    : { morning: [], afternoon: [], evening: [] };

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
          <span className="expand-indicator">{isExpanded ? "▼" : "►"}</span>
        </div>
        {/* Per-day generate buttons - 3 buttons in a single row */}
        <div className="day-buttons-row">
          <button
            type="button"
            className="component-btn compact"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateMeal();
            }}
            disabled={loadingComponent === "meals"}
          >
            {loadingComponent === "meals" ? "Generating..." : "for-meal"}
          </button>
          <button
            type="button"
            className="component-btn compact"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateAccommodation();
            }}
            disabled={loadingComponent === "accommodation"}
          >
            {loadingComponent === "accommodation"
              ? "Generating..."
              : "accomodation"}
          </button>
          <button
            type="button"
            className="component-btn compact"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateTransport();
            }}
            disabled={loadingComponent === "transport"}
          >
            {loadingComponent === "transport" ? "Generating..." : "meal"}
          </button>
        </div>
        {dayData.weather && (
          <div className="weather-info">🌤️ {dayData.weather}</div>
        )}
      </div>

      {isExpanded && (
        <>
          {dayData.notes && (
            <div className="day-notes">
              <p>{dayData.notes}</p>
            </div>
          )}

          {/* Activities Section */}
          {dayData.activities && dayData.activities.length > 0 && (
            <div className="activities-section">
              <h4>Activities</h4>

              {/* Timeline view for activities */}
              <div className="timeline-view">
                {Object.entries(timeGroups).map(
                  ([timePeriod, activities]) =>
                    activities.length > 0 && (
                      <div key={timePeriod} className="time-period">
                        <div className="time-chip">
                          {timePeriod.charAt(0).toUpperCase() +
                            timePeriod.slice(1)}
                        </div>
                        <div className="activities-list">
                          {activities.map((activity, index) => (
                            <div key={index} className="activity-item">
                              <div className="activity-header">
                                <span className="activity-icon">
                                  {getCategoryIcon(activity.category)}
                                </span>
                                <span className="activity-time">
                                  {formatTime(activity.time)}
                                </span>
                                {activity.cost && (
                                  <span className="activity-cost">
                                    {formatCurrency(activity.cost)}
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
                                {activity.entryFee && (
                                  <span className="entry-fee-badge">
                                    Entry Fee:{" "}
                                    {formatCurrency(activity.entryFee)}
                                  </span>
                                )}
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
                    )
                )}
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
                      {meal.cost && (
                        <span className="meal-cost">
                          {formatCurrency(meal.cost)}
                        </span>
                      )}
                    </div>
                    <div className="meal-content">
                      <h5>{meal.recommendation}</h5>
                      {meal.cuisineType && (
                        <span className="cuisine-type">{meal.cuisineType}</span>
                      )}
                      {meal.location && (
                        <div className="location-link">
                          {parseAndFormatUrl(meal.location)}
                        </div>
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
                  <p className="location">
                    📍 {dayData.accommodation.location}
                  </p>
                  {dayData.accommodation.rating && (
                    <div className="rating">
                      {"★".repeat(Math.floor(dayData.accommodation.rating))}
                      {"☆".repeat(5 - Math.floor(dayData.accommodation.rating))}
                      <span>({dayData.accommodation.rating})</span>
                    </div>
                  )}
                  {dayData.accommodation.cost && (
                    <p className="cost">
                      Cost: {formatCurrency(dayData.accommodation.cost)}
                      /night
                    </p>
                  )}
                </div>
                {dayData.accommodation.notes && (
                  <div className="accommodation-notes">
                    <p>{dayData.accommodation.notes}</p>
                  </div>
                )}
                {dayData.accommodation.location && (
                  <div className="location-link">
                    {parseAndFormatUrl(dayData.accommodation.location)}
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
                    <strong>Estimated Cost:</strong>{" "}
                    {formatCurrency(dayData.transportation.estimatedCost)}
                  </p>
                )}
                {dayData.transportation.notes && (
                  <p className="transport-notes">
                    {dayData.transportation.notes}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DayCard;
