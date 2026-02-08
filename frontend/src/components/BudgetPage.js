import React, { useState, useEffect } from "react";
import "./BudgetPage.css";

const BudgetPage = ({ travelPlan, onUpdatePlan }) => {
    const [expenses, setExpenses] = useState(travelPlan?.expenses || []);
    const [newExpense, setNewExpense] = useState({
        category: "food",
        amount: "",
        description: "",
    });
    const [estimatedCosts, setEstimatedCosts] = useState({
        total: 0,
        byCategory: {},
    });

    const parseCost = (costStr) => {
        if (!costStr) return 0;
        // Remove currency symbols and non-numeric characters except dots
        const cleanStr = costStr.replace(/[^\d.]/g, "");
        return parseFloat(cleanStr) || 0;
    };

    const calculateEstimates = React.useCallback((plan) => {
        let total = 0;
        const byCategory = {
            transport: 0,
            food: 0,
            accommodation: 0,
            activities: 0,
            shopping: 0,
            other: 0,
        };

        // Helper to add cost to category
        const addCost = (category, amount) => {
            const cat = category?.toLowerCase() || "other";
            if (byCategory[cat] !== undefined) {
                byCategory[cat] += amount;
            } else {
                // Map common terms
                if (cat.includes("transport") || cat.includes("travel") || cat.includes("flight") || cat.includes("train")) byCategory.transport += amount;
                else if (cat.includes("food") || cat.includes("meal") || cat.includes("drink")) byCategory.food += amount;
                else if (cat.includes("hotel") || cat.includes("stay") || cat.includes("lodging")) byCategory.accommodation += amount;
                else if (cat.includes("activity") || cat.includes("ticket") || cat.includes("entry") || cat.includes("sightseeing")) byCategory.activities += amount;
                else byCategory.other += amount;
            }
            total += amount;
        };

        // Parse Daily Itinerary
        if (plan.dailyItinerary) {
            plan.dailyItinerary.forEach((day) => {
                // Activities
                if (day.activities) {
                    day.activities.forEach((act) => {
                        if (act.cost) addCost("activities", parseCost(act.cost));
                        // Entry fees often separate
                        if (act.entryFee) addCost("activities", parseCost(act.entryFee));
                    });
                }
                // Meals
                if (day.meals) {
                    // Meals often don't have explicit cost in simple strings, but sometimes do
                    // If meal is an object with cost
                    day.meals.forEach(meal => {
                        if (typeof meal === 'object' && meal.cost) {
                            addCost("food", parseCost(meal.cost));
                        }
                    });
                }
                // Accommodation (if per day)
                if (day.accommodation && typeof day.accommodation === 'object' && day.accommodation.cost) {
                    addCost("accommodation", parseCost(day.accommodation.cost));
                }
                // Transport (if per day)
                if (day.transportation && day.transportation.estimatedCost) {
                    addCost("transport", parseCost(day.transportation.estimatedCost));
                }
            });
        }

        // Parse Global Budget Breakdown if available (as fallback or base)
        // Sometimes the AI gives a total estimated budget. We can use that if parsing fails or supplements.
        // For now, let's rely on the bottom-up summation as it allows tracking user-selected activities.
        // However, if summation is 0, maybe use the top-level budget if it exists.
        if (total === 0 && plan.budget && plan.budget.breakdown) {
            Object.entries(plan.budget.breakdown).forEach(([cat, amountStr]) => {
                addCost(cat, parseCost(amountStr));
            });
        }

        setEstimatedCosts({ total, byCategory });
    }, []);

    // Calculate estimated costs from itinerary on mount or plan change
    useEffect(() => {
        if (travelPlan) {
            calculateEstimates(travelPlan);
            if (travelPlan.expenses) {
                setExpenses(travelPlan.expenses);
            }
        }
    }, [travelPlan, calculateEstimates]);


    const handleAddExpense = (e) => {
        e.preventDefault();
        if (!newExpense.amount || !newExpense.description) return;

        const expense = {
            id: Date.now(),
            ...newExpense,
            amount: parseFloat(newExpense.amount),
            date: new Date().toISOString(),
        };

        const updatedExpenses = [...expenses, expense];
        setExpenses(updatedExpenses);

        // Reset form
        setNewExpense({
            category: "food",
            amount: "",
            description: "",
        });

        // Update parent plan
        const updatedPlan = {
            ...travelPlan,
            expenses: updatedExpenses
        };
        onUpdatePlan(updatedPlan);
    };

    const handleDeleteExpense = (id) => {
        const updatedExpenses = expenses.filter(exp => exp.id !== id);
        setExpenses(updatedExpenses);
        const updatedPlan = {
            ...travelPlan,
            expenses: updatedExpenses
        };
        onUpdatePlan(updatedPlan);
    };

    const calculateActualTotal = () => {
        return expenses.reduce((sum, item) => sum + item.amount, 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleShare = () => {
        const actualTotal = calculateActualTotal();
        const balance = estimatedCosts.total - actualTotal;

        let summary = `Trip Budget Summary for ${travelPlan.destination}\n\n`;
        summary += `Estimated Budget: ${formatCurrency(estimatedCosts.total)}\n`;
        summary += `Actual Spending: ${formatCurrency(actualTotal)}\n`;
        summary += `Remaining: ${formatCurrency(balance)}\n\n`;

        summary += `--- Expenses ---\n`;
        expenses.forEach(exp => {
            summary += `${exp.description} (${exp.category}): ${formatCurrency(exp.amount)}\n`;
        });

        navigator.clipboard.writeText(summary)
            .then(() => alert("Budget summary copied to clipboard!"))
            .catch(err => console.error("Failed to copy", err));
    };

    const actualTotal = calculateActualTotal();
    const balance = estimatedCosts.total - actualTotal;
    const progressPercent = Math.min((actualTotal / (estimatedCosts.total || 1)) * 100, 100);

    return (
        <div className="budget-page-container">
            <div className="budget-header">
                <h2>Travel Budget Tracker</h2>
                <button className="share-btn" onClick={handleShare} title="Copy Budget Summary">
                    🗒
                </button>
            </div>

            {/* Summary Cards */}
            <div className="budget-summary-cards">
                <div className="summary-card estimated">
                    <h3>Estimated Cost</h3>
                    <p className="amount">{formatCurrency(estimatedCosts.total)}</p>
                    <span className="subtitle">Based on Itinerary</span>
                </div>
                <div className="summary-card actual">
                    <h3>Actual Spend</h3>
                    <p className="amount">{formatCurrency(actualTotal)}</p>
                    <span className="subtitle">{expenses.length} transactions</span>
                </div>
                <div className={`summary-card balance ${balance < 0 ? 'negative' : ''}`}>
                    <h3>Remaining</h3>
                    <p className="amount">{formatCurrency(balance)}</p>
                    <span className="subtitle">{balance < 0 ? "Over Budget" : "Under Budget"}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="budget-progress-section">
                <div className="progress-label">
                    <span>Budget Usage</span>
                    <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="progress-bar-container">
                    <div
                        className={`progress-bar-fill ${progressPercent > 90 ? 'danger' : progressPercent > 70 ? 'warning' : 'success'}`}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>

            <div className="budget-content-grid">
                {/* Add Expense Form */}
                <div className="add-expense-section">
                    <h3>Add New Expense</h3>
                    <form onSubmit={handleAddExpense}>
                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                            >
                                <option value="transport">Transport</option>
                                <option value="food">Food & Dining</option>
                                <option value="accommodation">Accommodation</option>
                                <option value="activities">Activities & Attractions</option>
                                <option value="shopping">Shopping</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <input
                                type="text"
                                placeholder="e.g., Taxi to hotel"
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Amount</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                required
                                min="0"
                            />
                        </div>

                        <button type="submit" className="add-btn">Add Expense +</button>
                    </form>
                </div>

                {/* Expense List */}
                <div className="expense-list-section">
                    <h3>Recent Expenses</h3>
                    {expenses.length === 0 ? (
                        <p className="no-expenses">No expenses added yet.</p>
                    ) : (
                        <ul className="expense-list">
                            {expenses.slice().reverse().map((exp) => (
                                <li key={exp.id} className="expense-item">
                                    <div className="expense-info">
                                        <span className={`category-tag ${exp.category}`}>{exp.category}</span>
                                        <span className="expense-desc">{exp.description}</span>
                                    </div>
                                    <div className="expense-amount-actions">
                                        <span className="expense-amount">{formatCurrency(exp.amount)}</span>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteExpense(exp.id)}
                                            aria-label="Delete expense"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BudgetPage;
