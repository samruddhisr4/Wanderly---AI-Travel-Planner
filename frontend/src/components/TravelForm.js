import React, { useState } from "react";

const TravelForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    travelStyle: "balanced",
    travelType: "general",
    constraints: [],
  });

  // Available constraints
  const availableConstraints = [
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
    const { name, value, type, checked } = e.target;

    if (name === "constraints") {
      // Handle checkbox changes
      setFormData((prev) => {
        const newConstraints = checked
          ? [...prev.constraints, value]
          : prev.constraints.filter((c) => c !== value);
        return {
          ...prev,
          constraints: newConstraints,
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
    <form className="travel-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="destination">Destination *</label>
        <input
          type="text"
          id="destination"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          placeholder="e.g., Paris, France"
          required
        />
      </div>

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

      <div className="form-group">
        <label htmlFor="budget">Budget (approximate) *</label>
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
        <label htmlFor="travelStyle">Travel Style *</label>
        <select
          id="travelStyle"
          name="travelStyle"
          value={formData.travelStyle}
          onChange={handleChange}
          required
        >
          <option value="chill">Chill - Leisurely exploration</option>
          <option value="balanced">
            Balanced - Mix of activities and relaxation
          </option>
          <option value="fast-paced">Fast-paced - Maximize sightseeing</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="travelType">Travel Type *</label>
        <select
          id="travelType"
          name="travelType"
          value={formData.travelType}
          onChange={handleChange}
          required
        >
          <option value="general">General Travel</option>
          <option value="solo">Solo Travel</option>
          <option value="couple">Couple Travel</option>
          <option value="family">Family Travel</option>
          <option value="friends">Friends Group</option>
          <option value="business">Business Travel</option>
          <option value="female">Solo Female Travel</option>
        </select>
      </div>

      <div className="form-group">
        <label>Special Constraints (Optional)</label>
        <div className="checkbox-group">
          {availableConstraints.map((constraint) => (
            <div key={constraint} className="checkbox-item">
              <input
                type="checkbox"
                id={`constraint-${constraint}`}
                name="constraints"
                value={constraint}
                checked={formData.constraints.includes(constraint)}
                onChange={handleChange}
              />
              <label htmlFor={`constraint-${constraint}`}>{constraint}</label>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? "Generating Plan..." : "Generate Travel Plan"}
      </button>
    </form>
  );
};

export default TravelForm;
