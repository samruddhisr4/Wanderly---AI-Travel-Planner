import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./DayCard.css";

// Sortable Item Component
const SortableActivityItem = ({ activity, formatTime, getCategoryIcon, formatCurrency, parseAndFormatUrl }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: activity.id || activity.title });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="activity-item sortable-item">
      <div className="activity-header">
        <span className="drag-handle">☰</span>
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

        <div className="activity-details-row">
          {activity.openingHours && (
            <span className="detail-badge hours">
              🕒 {activity.openingHours}
            </span>
          )}
          {activity.entryFee !== undefined && activity.entryFee > 0 && (
            <span className="detail-badge fee">
              🎟️ Entry: {formatCurrency(activity.entryFee)}
            </span>
          )}
          {activity.duration && (
            <span className="detail-badge duration">
              ⏱️ {activity.duration}
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
  );
};

const DayCard = ({
  dayData,
  isSelected,
  onUpdateActivities,
}) => {
  const [isExpanded, setIsExpanded] = useState(dayData?.dayNumber === 1);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!dayData) return null;

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = dayData.activities.findIndex(item => (item.id || item.title) === active.id);
      const newIndex = dayData.activities.findIndex(item => (item.id || item.title) === over.id);

      const newActivities = arrayMove(dayData.activities, oldIndex, newIndex);

      // Notify parent to update state
      if (onUpdateActivities) {
        onUpdateActivities(dayData.dayNumber, newActivities);
      }
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
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
          <span className="expand-indicator">{isExpanded ? "▼" : "►"}</span>
        </div>

        <div className="day-header-actions">
          <button className="share-icon-btn" onClick={handleShareDay} title="Share Day">
            📤
          </button>
          {dayData.weather && (
            <div className="weather-info">🌤️ {dayData.weather}</div>
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

          {/* Activities Section with DND */}
          {dayData.activities && dayData.activities.length > 0 && (
            <div className="activities-section">
              <h4>
                Activities
                <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
                  (Drag to reorder)
                </span>
              </h4>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={dayData.activities.map(a => a.id || a.title)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="activities-list">
                    {dayData.activities.map((activity) => (
                      <SortableActivityItem
                        key={activity.id || activity.title}
                        activity={activity}
                        formatTime={formatTime}
                        getCategoryIcon={getCategoryIcon}
                        formatCurrency={formatCurrency}
                        parseAndFormatUrl={parseAndFormatUrl}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
                    📍 {dayData.accommodation.location}
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

