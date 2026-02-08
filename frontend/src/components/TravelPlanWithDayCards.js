import React from "react";
import DayCard from "./DayCard";

const TravelPlanWithDayCards = ({
  plan,
  onComponentGenerate,
  loadingComponent,
}) => {
  if (!plan) return null;

  const { dailyItinerary } = plan;

  if (!dailyItinerary || dailyItinerary.length === 0) return null;

  return (
    <div className="daily-itinerary-section" style={{ border: "none" }}>
      <h3 style={{ border: "none" }}>Daily Itinerary</h3>
      {dailyItinerary.map((day, idx) => {
        // Transform the backend data structure to match frontend expectations
        const dayData = {
          dayNumber: day.dayNumber || day.day || idx + 1,
          date: day.date || day.dateString || "",
          activities: Array.isArray(day.activities)
            ? day.activities.map((activity, i) => ({
                title: activity,
                time: "",
                description: "",
                category: "activity",
              }))
            : [],
          meals: Array.isArray(day.meals)
            ? day.meals.map((meal, i) => ({
                time: "",
                type: meal.split(":")[0] || "Meal",
                recommendation: meal.split(":")[1] || meal,
                cuisineType: "",
              }))
            : [],
          accommodation: day.accommodation
            ? { name: day.accommodation, type: "Hotel", location: "" }
            : null,
          transportation: day.transportation || day.transport || null,
          notes: day.notes || day.note || "",
          weather: day.weather || null,
        };

        const handleGen = (componentType) => {
          if (onComponentGenerate) {
            onComponentGenerate(componentType, {
              dayNumber: dayData.dayNumber,
            });
          }
        };

        return (
          <DayCard
            key={dayData.dayNumber}
            dayData={dayData}
            isSelected={false}
            onGenerateMeal={() => handleGen("meals")}
            onGenerateAccommodation={() => handleGen("accommodation")}
            onGenerateTransport={() => handleGen("transport")}
            loadingComponent={loadingComponent}
          />
        );
      })}
    </div>
  );
};

export default TravelPlanWithDayCards;
