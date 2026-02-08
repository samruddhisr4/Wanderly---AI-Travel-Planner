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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    // Convert constraints to lowercase to match backend expectations
    const processedData = {
      ...formData,
      constraints: [], // Send empty array as backend expects it
    };
    onSubmit(processedData);
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
