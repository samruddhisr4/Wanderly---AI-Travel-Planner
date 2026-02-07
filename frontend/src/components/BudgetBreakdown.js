import React from "react";
import "./BudgetBreakdown.css";

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

const BudgetBreakdown = ({ budgetData, totalBudget }) => {
  if (!budgetData) {
    return (
      <div className="budget-breakdown">
        <div className="no-budget">
          <h3>Budget Information</h3>
          <p>No budget data available</p>
        </div>
      </div>
    );
  }

  const categories = [
    {
      key: "accommodation",
      label: "Accommodation",
      icon: "🏨",
      color: colorPalette.vintage_lavender[500],
      lightColor: colorPalette.vintage_lavender[800],
      darkColor: colorPalette.vintage_lavender[300],
    },
    {
      key: "food",
      label: "Food",
      icon: "🍽️",
      color: colorPalette.pearl_beige[500],
      lightColor: colorPalette.pearl_beige[800],
      darkColor: colorPalette.pearl_beige[300],
    },
    {
      key: "transportation",
      label: "Transportation",
      icon: "🚗",
      color: colorPalette.midnight_violet[700],
      lightColor: colorPalette.midnight_violet[800],
      darkColor: colorPalette.midnight_violet[500],
    },
    {
      key: "activities",
      label: "Activities",
      icon: "🎉",
      color: colorPalette.ash_grey[500],
      lightColor: colorPalette.ash_grey[800],
      darkColor: colorPalette.ash_grey[300],
    },
    {
      key: "contingency",
      label: "Contingency",
      icon: "💰",
      color: colorPalette.ash_grey[500],
      lightColor: colorPalette.ash_grey[800],
      darkColor: colorPalette.ash_grey[300],
    },
  ];

  const calculatePercentage = (amount) => {
    if (!totalBudget || totalBudget === 0) return 0;
    return Math.round((amount / totalBudget) * 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="budget-breakdown">
      <div className="budget-header">
        <h2>Budget Breakdown</h2>
        <div className="total-budget">
          <span className="total-label">Total Budget:</span>
          <span className="total-amount">{formatCurrency(totalBudget)}</span>
        </div>
      </div>

      <div className="budget-categories">
        {categories.map((category) => {
          const categoryData =
            budgetData.categories?.[category.key] || budgetData[category.key];
          if (!categoryData) return null;

          const amount = categoryData.amount || 0;
          const percentage = calculatePercentage(amount);
          const description = categoryData.description || "";

          return (
            <div key={category.key} className="budget-category">
              <div className="category-header">
                <div className="category-info">
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-label">{category.label}</span>
                </div>
                <div className="category-amount">{formatCurrency(amount)}</div>
              </div>

              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${category.color} 0%, ${category.lightColor} 100%)`,
                    boxShadow: `0 3px 8px ${category.color}40`,
                  }}
                ></div>
              </div>

              <div className="category-details">
                <span className="percentage">{percentage}%</span>
                {description && (
                  <span className="description">{description}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Summary */}
      <div className="budget-summary">
        <h3>Budget Summary</h3>
        <div className="summary-stats">
          <div className="stat-card">
            <span className="stat-label">Daily Average</span>
            <span className="stat-value">
              {formatCurrency(Math.round(totalBudget / 7))}{" "}
              {/* Assuming 7-day trip for example */}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Major Expenses</span>
            <span className="stat-value">
              {formatCurrency(
                (budgetData.categories?.accommodation?.amount || 0) +
                  (budgetData.categories?.food?.amount || 0),
              )}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Flexibility Buffer</span>
            <span className="stat-value">
              {formatCurrency(budgetData.categories?.contingency?.amount || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Savings Tips */}
      {budgetData.savingsTips && budgetData.savingsTips.length > 0 && (
        <div className="savings-tips">
          <h3>💰 Savings Tips</h3>
          <ul>
            {budgetData.savingsTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BudgetBreakdown;
