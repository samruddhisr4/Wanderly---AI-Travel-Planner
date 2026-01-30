import React, { useState } from "react";
import TravelForm from "./components/TravelForm";
import TravelPlan from "./components/TravelPlan";
import "./App.css";

function App() {
  const [travelPlan, setTravelPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateTravelPlan = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3004/api/travel/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTravelPlan(data.data);
    } catch (err) {
      setError("Failed to generate travel plan. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>AI Travel Planner</h1>
      <p>Plan your perfect trip with AI assistance</p>

      <TravelForm onSubmit={generateTravelPlan} loading={loading} />

      {loading && <div className="loading">Generating your travel plan...</div>}

      {error && <div className="error">{error}</div>}

      {travelPlan && <TravelPlan plan={travelPlan} />}
    </div>
  );
}

export default App;
