import React, { useState, useEffect } from "react";
import TravelForm from "./components/TravelForm";
import TravelPlan from "./components/TravelPlan";
import { scrollToTop } from "./utils/scrollUtils";
import "./App.css";

function App() {
  const [travelPlan, setTravelPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [generatedComponents, setGeneratedComponents] = useState({
    itinerary: null,
    meals: null,
    accommodation: null,
    transport: null
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const generateTravelPlan = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3005/api/travel/plan", {
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

  const generateComponent = async (componentType, formData) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = `http://localhost:3005/api/travel/${componentType}`;
      const response = await fetch(endpoint, {
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
      
      // Update the specific component
      setGeneratedComponents(prev => ({
        ...prev,
        [componentType]: data.data
      }));

      // If we have all components, create a complete travel plan
      const updatedComponents = {
        ...generatedComponents,
        [componentType]: data.data
      };
      
      if (updatedComponents.itinerary && updatedComponents.meals && 
          updatedComponents.accommodation && updatedComponents.transport) {
        setTravelPlan({
          dailyItinerary: updatedComponents.itinerary.dailyItinerary,
          meals: updatedComponents.meals.meals,
          accommodation: updatedComponents.accommodation.accommodation,
          transport: updatedComponents.transport.transport,
          tripOverview: updatedComponents.itinerary.tripOverview
        });
      }
    } catch (err) {
      setError(`Failed to generate ${componentType}. Please try again.`);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <h1 style={{ fontFamily: "sans-serif", fontSize: "3.5rem", fontWeight: "bold" }}>Wanderly-AI Travel Planner</h1>
        </div>
        <p className="subtitle" style={{ fontFamily: "sans-serif", fontSize: "1.4rem" }}>Plan your perfect trip with AI assistance</p>
      </header>

      <main className="app-main">
        <TravelForm 
          onSubmit={generateTravelPlan} 
          onComponentGenerate={generateComponent}
          loading={loading} 
        />

        {loading && (
          <div className="loading">Generating your travel plan...</div>
        )}

        {error && <div className="error">{error}</div>}

        {travelPlan && <TravelPlan plan={travelPlan} />}
      </main>

      {showBackToTop && (
        <button
          className="back-to-top-btn"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default App;