import React, { useState } from "react";
import "./TripForm.css";

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

        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
          style={{
            backgroundColor: loading ? "#c6d2cd" : "#f4d58d",
            color: "#001427",
          }}
        >
          {loading ? "Generating Plan..." : "Generate Travel Plan"}
        </button>
      </div>
    </form>
  );
};

export default TripForm;
