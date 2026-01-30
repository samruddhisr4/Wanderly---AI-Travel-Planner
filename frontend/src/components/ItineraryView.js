import React, { useState } from "react";
import DayCard from "./DayCard";
import "./ItineraryView.css";

const ItineraryView = ({ itinerary, tripSummary }) => {
  const [selectedDay, setSelectedDay] = useState(1);

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="itinerary-view">
        <div className="no-itinerary">
          <h3>No itinerary available</h3>
          <p>Generate a travel plan to see your day-by-day itinerary.</p>
        </div>
      </div>
    );
  }

  const handleDaySelect = (dayNumber) => {
    setSelectedDay(dayNumber);
  };

  const selectedDayData =
    itinerary.find((day) => day.dayNumber === selectedDay) || itinerary[0];

  return (
    <div className="itinerary-view">
      <div className="itinerary-header">
        <h2>
          Your {tripSummary?.durationDays || itinerary.length}-Day Itinerary
        </h2>
        <p>{tripSummary?.destination || "Travel Destination"}</p>
      </div>

      <div className="itinerary-content">
        {/* Day Navigation */}
        <div className="day-navigation">
          <h3>Days</h3>
          <div className="days-list">
            {itinerary.map((day) => (
              <button
                key={day.dayNumber}
                className={`day-button ${
                  selectedDay === day.dayNumber ? "active" : ""
                }`}
                onClick={() => handleDaySelect(day.dayNumber)}
              >
                Day {day.dayNumber}
                <span className="day-date">{day.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Day Details */}
        <div className="day-details">
          {selectedDayData && (
            <DayCard
              dayData={selectedDayData}
              isSelected={selectedDay === selectedDayData.dayNumber}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ItineraryView;
