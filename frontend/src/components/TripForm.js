import React, { useState } from "react";
import "./TripForm.css";

const TripForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    travelStyle: "balanced",
    travelType: "general",
    constraints: [],
  });

  const [constraintInput, setConstraintInput] = useState("");

  const travelStyles = [
    { value: "chill", label: "Chill - Leisurely exploration" },
    { value: "balanced", label: "Balanced - Mix of activities and relaxation" },
    { value: "fast-paced", label: "Fast-paced - Maximize sightseeing" },
  ];

  const travelTypes = [
    { value: "solo", label: "Solo Travel" },
    { value: "couple", label: "Couple" },
    { value: "family", label: "Family" },
    { value: "friends", label: "Friends" },
    { value: "business", label: "Business" },
  ];

  const validConstraints = [
    "no flights",
    "vegetarian",
    "wheelchair accessible",
    "pet friendly",
    "budget accommodation",
    "luxury only",
    "no museums",
    "outdoor activities only",
    "cultural sites only",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConstraintAdd = (e) => {
    if (e.key === "Enter" && constraintInput.trim()) {
      e.preventDefault();
      if (
        validConstraints.includes(constraintInput.trim()) &&
        !formData.constraints.includes(constraintInput.trim())
      ) {
        setFormData((prev) => ({
          ...prev,
          constraints: [...prev.constraints, constraintInput.trim()],
        }));
        setConstraintInput("");
      }
    }
  };

  const removeConstraint = (constraintToRemove) => {
    setFormData((prev) => ({
      ...prev,
      constraints: prev.constraints.filter((c) => c !== constraintToRemove),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.destination ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.budget
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert("Start date must be before end date");
      return;
    }

    if (formData.budget <= 0) {
      alert("Budget must be a positive number");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form className="trip-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>Plan Your Trip</h2>

        <div className="form-group">
          <label htmlFor="destination">Destination *</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            placeholder="e.g., Jaipur, Rajasthan"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="budget">Budget *</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="e.g., 1500"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="travelStyle">Travel Style</label>
            <select
              id="travelStyle"
              name="travelStyle"
              value={formData.travelStyle}
              onChange={handleChange}
            >
              {travelStyles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="travelType">Travel Type</label>
          <select
            id="travelType"
            name="travelType"
            value={formData.travelType}
            onChange={handleChange}
          >
            {travelTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="constraints">Special Requirements</label>
          <div className="constraint-input-container">
            <input
              type="text"
              id="constraints"
              value={constraintInput}
              onChange={(e) => setConstraintInput(e.target.value)}
              onKeyDown={handleConstraintAdd}
              placeholder="Type and press Enter (e.g., vegetarian, no flights)"
              list="constraint-options"
            />
            <datalist id="constraint-options">
              {validConstraints.map((constraint) => (
                <option key={constraint} value={constraint} />
              ))}
            </datalist>
          </div>

          {formData.constraints.length > 0 && (
            <div className="constraints-list">
              {formData.constraints.map((constraint, index) => (
                <span key={index} className="constraint-tag">
                  {constraint}
                  <button
                    type="button"
                    onClick={() => removeConstraint(constraint)}
                    className="remove-constraint"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={loading} style={{ backgroundColor: loading ? '#64748b' : '#056b49' }}>
          {loading ? "Generating Plan..." : "Generate Travel Plan"}
        </button>
      </div>
    </form>
  );
};

export default TripForm;
