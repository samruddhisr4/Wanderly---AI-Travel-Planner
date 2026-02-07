import React, { useState } from "react";
import DayCard from "./DayCard";
import "./ItineraryView.css";

const colorPalette = {
  pearl_beige: {
    DEFAULT: "#f4e8c1",
    100: "#4b3c0d",
    200: "#95781a",
    300: "#dab22d",
    400: "#e7cd78",
    500: "#f4e8c1",
    600: "#f6edce",
    700: "#f9f2db",
    800: "#fbf6e7",
    900: "#fdfbf3",
  },
  ash_grey: {
    DEFAULT: "#a0c1b9",
    100: "#1c2b27",
    200: "#38554e",
    300: "#538075",
    400: "#75a599",
    500: "#a0c1b9",
    600: "#b2cdc6",
    700: "#c6dad5",
    800: "#d9e6e3",
    900: "#ecf3f1",
  },
  pacific_blue: {
    DEFAULT: "#70a0af",
    100: "#152125",
    200: "#294249",
    300: "#3e626e",
    400: "#528392",
    500: "#70a0af",
    600: "#8cb3be",
    700: "#a9c6cf",
    800: "#c6d9df",
    900: "#e2ecef",
  },
  vintage_lavender: {
    DEFAULT: "#706993",
    100: "#16151d",
    200: "#2c293a",
    300: "#423e58",
    400: "#595375",
    500: "#706993",
    600: "#8b85a9",
    700: "#a8a4be",
    800: "#c5c2d4",
    900: "#e2e1e9",
  },
  midnight_violet: {
    DEFAULT: "#331e38",
    100: "#0a060b",
    200: "#140c17",
    300: "#1f1222",
    400: "#29182d",
    500: "#331e38",
    600: "#653c6f",
    700: "#975aa6",
    800: "#ba91c4",
    900: "#dcc8e1",
  },
};

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
    <div
      className="itinerary-view"
      style={{ backgroundColor: colorPalette.pearl_beige[800] }}
    >
      <div className="itinerary-header">
        <h2 style={{ color: colorPalette.midnight_violet.DEFAULT }}>
          Your {tripSummary?.durationDays || itinerary.length}-Day Itinerary
        </h2>
        <p style={{ color: colorPalette.midnight_violet[600] }}>
          {tripSummary?.destination || "Travel Destination"}
        </p>
      </div>

      <div className="itinerary-content">
        {/* Day Navigation */}
        <div className="day-navigation">
          <h3 style={{ color: colorPalette.midnight_violet.DEFAULT }}>Days</h3>
          <div className="days-list">
            {itinerary.map((day) => (
              <button
                key={day.dayNumber}
                className={`day-button ${selectedDay === day.dayNumber ? "active" : ""}`}
                onClick={() => handleDaySelect(day.dayNumber)}
                style={{
                  backgroundColor:
                    selectedDay === day.dayNumber
                      ? colorPalette.vintage_lavender.DEFAULT
                      : colorPalette.pearl_beige.DEFAULT,
                  color:
                    selectedDay === day.dayNumber
                      ? colorPalette.pearl_beige.DEFAULT
                      : colorPalette.midnight_violet.DEFAULT,
                }}
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
