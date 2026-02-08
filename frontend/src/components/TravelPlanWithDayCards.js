import React from "react";
import DayCard from "./DayCard";

const TravelPlanWithDayCards = ({
  plan,
  onComponentGenerate,
  loadingComponent,
  onUpdatePlan,
}) => {
  if (!plan) return null;

  const { dailyItinerary } = plan;

  if (!dailyItinerary || dailyItinerary.length === 0) return null;

  const handleActivityUpdate = (dayNumber, newActivities) => {
    if (!onUpdatePlan) return;

    const updatedItinerary = dailyItinerary.map(day => {
      const currentDayNum = day.dayNumber || day.day;
      if (currentDayNum === dayNumber) {
        return { ...day, activities: newActivities };
      }
      return day;
    });

    onUpdatePlan({ ...plan, dailyItinerary: updatedItinerary });
  };

  return (
    <div className="daily-itinerary-section" style={{ border: "none" }}>
      <h3 style={{ border: "none" }}>Daily Itinerary</h3>
      {dailyItinerary.map((day, idx) => {
        // Transform the backend data structure to match frontend expectations
        // Handle both string activities (legacy) and object activities (new)
        const activities = Array.isArray(day.activities)
          ? day.activities.map((activity, i) => {
            if (typeof activity === 'string') {
              return {
                id: `act-${day.day}-${i}`,
                title: activity,
                time: "",
                description: "",
                category: "activity",
              };
            }
            return {
              id: activity.id || `act-${day.day}-${i}`,
              ...activity
            };
          })
          : [];

        const dayData = {
          dayNumber: day.dayNumber || day.day || idx + 1,
          date: day.date || day.dateString || "",
          activities: activities,
          meals: Array.isArray(day.meals)
            ? day.meals.map((meal, i) => {
              if (typeof meal === 'string') {
                return {
                  time: "",
                  type: meal.split(":")[0] || "Meal",
                  recommendation: meal.split(":")[1] || meal,
                  cuisineType: "",
                };
              }
              return meal;
            })
            : [],
          accommodation: day.accommodation
            ? (typeof day.accommodation === 'string'
              ? { name: day.accommodation, type: "Hotel", location: "" }
              : day.accommodation)
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
            onUpdateActivities={handleActivityUpdate}
          />
        );
      })}
    </div>
  );
};

export default TravelPlanWithDayCards;
