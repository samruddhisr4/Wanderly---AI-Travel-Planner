import React from "react";
import "./BudgetBreakdown.css";

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
      color: "#10b981", // emerald-500
    },
    {
      key: "food",
      label: "Food",
      icon: "🍽️",
      color: "#f59e0b", // amber-500
    },
    {
      key: "transportation",
      label: "Transportation",
      icon: "🚗",
      color: "#3b82f6", // blue-500
    },
    {
      key: "activities",
      label: "Activities",
      icon: "🎉",
      color: "#8b5cf6", // violet-500
    },
    {
      key: "contingency",
      label: "Contingency",
      icon: "💰",
      color: "#ef4444", // red-500
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
                    backgroundColor: category.color,
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
                  (budgetData.categories?.food?.amount || 0)
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
