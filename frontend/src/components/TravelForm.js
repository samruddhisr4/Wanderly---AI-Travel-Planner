import React, { useState } from "react";
import "./TravelForm.css";

const TravelForm = ({
  onSubmit,
  onComponentGenerate,
  loading,
  loadingComponent,
  user,
}) => {
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
    "No flights",
    "Vegetarian",
    "Wheelchair accessible",
    "Pet friendly",
    "Budget accommodation",
    "Luxury only",
    "No museums",
    "Outdoor activities only",
    "Cultural sites only",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "constraints") {
      // Handle checkbox changes
      setFormData((prev) => {
        const newConstraints = e.target.checked
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

    // Convert constraints to lowercase to match backend expectations
    const processedData = {
      ...formData,
      constraints: formData.constraints.map((c) => c.toLowerCase()),
    };
    onSubmit(processedData);
  };

  const handleComponentGenerate = (componentType) => {
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

    // Convert constraints to lowercase to match backend expectations
    const processedData = {
      ...formData,
      constraints: formData.constraints.map((c) => c.toLowerCase()),
    };

    onComponentGenerate(componentType, processedData);
  };

  // Get button text with loading state
  const getButtonText = (componentType) => {
    if (loadingComponent === componentType) {
      return `Generating ${componentType}...`;
    }
    switch (componentType) {
      case "itinerary":
        return "Generate Itinerary";
      case "meals":
        return "Generate Meal Options";
      case "accommodation":
        return "Generate Accommodation";
      case "transport":
        return "Generate Transport";
      default:
        return `Generate ${componentType}`;
    }
  };

  return (
    <form className="travel-form" onSubmit={handleSubmit}>
      <div className="form-group" style={{}}>
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
          placeholder="e.g., 20000"
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

      {/* Only main generation button is shown. Per-day generation appears on each day after itinerary is created. */}

      <button
        type="submit"
        className="submit-btn"
        disabled={loading}
        style={{
          backgroundColor: "black",
          color: "white",
          fontWeight: "bold",
        }}
      >
        {loading ? "Generating Itinerary..." : "Generate Itinerary"}
      </button>
    </form>
  );
};

export default TravelForm;
