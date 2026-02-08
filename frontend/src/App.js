import React, { useState, useEffect } from "react";
import TravelForm from "./components/TravelForm";
import TravelPlan from "./components/TravelPlan";
import Navbar from "./components/Navbar";
import AuthForm from "./components/AuthForm";
import PreviousTrips from "./components/PreviousTrips";
import BudgetPage from "./components/BudgetPage";
import authService from "./services/authService";


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
    transport: null,
  });
  const [loadingComponent, setLoadingComponent] = useState(null); // Track which component is loading
  const [activeSection, setActiveSection] = useState("home"); // Track active navbar section
  const [user, setUser] = useState(null); // User authentication state
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  // Dark mode state removed as requested

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = () => {
      if (authService.isAuthenticated()) {
        const userInfo = authService.getUserInfo();
        if (userInfo) {
          setUser(userInfo);
        }
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setTravelPlan(null);
    setGeneratedComponents({
      itinerary: null,
      meals: null,
      accommodation: null,
      transport: null,
    });
    setActiveSection("home");
  };

  const handleLogin = () => {
    setShowAuth(true);
    setAuthMode("login");
  };

  const handleRegister = () => {
    setShowAuth(true);
    setAuthMode("register");
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuth(false);
    setActiveSection("home");
  };

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

      // Save travel plan if user is logged in
      if (user) {
        try {
          await authService.saveTravelPlan(data.data);
          console.log("Travel plan saved automatically.");
        } catch (saveError) {
          console.error("Failed to auto-save travel plan:", saveError);
        }
      }
    } catch (err) {
      setError("Failed to generate itinerary. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateComponent = async (componentType, formData) => {
    console.log("Generate component called:", componentType, formData);
    setLoadingComponent(componentType); // Set specific component as loading
    setError(null);

    try {
      const endpoint = `http://localhost:3005/api/travel/${componentType}`;
      console.log("Making request to:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      // Update the specific component in state
      setGeneratedComponents((prev) => ({
        ...prev,
        [componentType]: data.data,
      }));

      // Create a consolidated plan with the new component
      let consolidatedPlan = {
        ...travelPlan, // Keep existing plan data
        ...data.data, // Add new component data
        tripOverview:
          data.data.tripOverview ||
          (travelPlan && travelPlan.tripOverview) ||
          null,
      };

      // If the response contains component data and we have dailyItinerary, merge appropriately
      if (data.data && travelPlan && travelPlan.dailyItinerary) {
        // Create a copy of the dailyItinerary to modify
        const updatedDailyItinerary = [...travelPlan.dailyItinerary];

        // Look for dayNumber in the formData to know which day to update
        const dayNumber = formData.dayNumber || 1;

        // Find the specific day to update
        const dayIndex = updatedDailyItinerary.findIndex(
          (day) => day.dayNumber === dayNumber || day.day === dayNumber
        );

        if (dayIndex !== -1) {
          // Update the specific day with new component data
          // Preserve existing day properties and add/update with new component data
          updatedDailyItinerary[dayIndex] = {
            ...updatedDailyItinerary[dayIndex],
            ...data.data, // This adds new component data to the specific day
          };

          // Update the consolidated plan with the modified dailyItinerary
          consolidatedPlan = {
            ...consolidatedPlan,
            dailyItinerary: updatedDailyItinerary,
          };
        } else {
          // If day not found in existing itinerary, just update the plan normally
          consolidatedPlan = {
            ...consolidatedPlan,
            ...data.data,
          };
        }
      }

      setTravelPlan(consolidatedPlan);

      // Save updated plan if user is logged in
      if (user) {
        try {
          // We need to save the FULL consolidated plan, not just the component
          // But the backend API for save might expect a specific structure.
          // For now, let's try saving the consolidated plan as a new version or update
          // Since we don't have the plan ID easily accessible here for update, 
          // we might just be saving new copies or we need to implement update logic.
          // For simplicity in this fix, we'll skip auto-saving component updates 
          // to avoid duplicating plans excessively, or we can try to update if we had an ID.
          // Let's safe the consolidated plan as a new entry for now to ensure persistence.
          await authService.saveTravelPlan(consolidatedPlan);
        } catch (e) {
          console.error("Failed to save updated plan:", e);
        }
      }

    } catch (err) {
      console.error("Error in generateComponent:", err);
      setError(`Failed to generate ${componentType}. Please try again.`);
    } finally {
      setLoadingComponent(null); // Clear loading state
    }
  };

  // Consolidate all generated components into a single plan for display
  const consolidatedPlan = travelPlan ? {
    ...travelPlan,
    ...(generatedComponents.itinerary || {}),
    ...(generatedComponents.meals || {}),
    ...(generatedComponents.accommodation || {}),
    ...(generatedComponents.transport || {}),
  } : null;


  if (showAuth) {
    return (
      <div className="app-container">
        <AuthForm onAuthSuccess={handleAuthSuccess} initialMode={authMode} />
      </div>
    );
  }

  return (
    <>
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onSelectTrip={(planData) => {
          setTravelPlan(planData);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <div className="app-container">
        <header
          className="app-header"
          style={{ display: activeSection === "home" ? "block" : "none" }}
        >
          <div className="logo-section">
            <h1
              style={{
                fontFamily: "sans-serif",
                fontSize: "3.5rem",
                fontWeight: "bold",
                color: "var(--neutral-text-primary)",
                fontStyle: "cursive",
                margin: "300",
                padding: "100",
              }}
            >
              Wanderly-AI Travel Planner
            </h1>
          </div>
          <p
            className="subtitle"
            style={{
              fontFamily: "sans-serif",
              fontSize: "1.4rem",
              color: "var(--neutral-text-primary)",
            }}
          >
            Plan your perfect trip with AI assistance
          </p>
        </header>

        <main className="app-main">
          {/* Home Section */}
          {activeSection === "home" && (
            <>
              <TravelForm
                onSubmit={generateTravelPlan}
                onComponentGenerate={generateComponent}
                loading={loading}
                loadingComponent={loadingComponent}
              />

              {loading && (
                <div className="loading">Generating your travel plan...</div>
              )}

              {error && <div className="error-message">{error}</div>}

              {consolidatedPlan && (
                <TravelPlan
                  plan={consolidatedPlan}
                  onComponentGenerate={(componentType, extra) =>
                    generateComponent(componentType, {
                      ...(consolidatedPlan.tripOverview || {}),
                      ...extra,
                    })
                  }
                  loadingComponent={loadingComponent}
                  onUpdatePlan={(updatedPlan) => {
                    setTravelPlan(updatedPlan);
                    if (user) {
                      authService.saveTravelPlan(updatedPlan).catch(console.error);
                    }
                  }}
                />
              )}
            </>
          )}

          {/* Itinerary Section */}
          {activeSection === "itinerary" && (
            <div>
              <h2>Travel Itinerary</h2>
              {/* Show current plan if available */}
              {consolidatedPlan ? (
                <div className="current-plan-section">
                  <h3>Current Plan</h3>
                  <TravelPlan
                    plan={consolidatedPlan}
                    onComponentGenerate={(componentType, extra) =>
                      generateComponent(componentType, {
                        ...(consolidatedPlan.tripOverview || {}),
                        ...extra,
                      })
                    }
                    loadingComponent={loadingComponent}
                    onUpdatePlan={(updatedPlan) => {
                      setTravelPlan(updatedPlan);
                      if (user) {
                        authService.saveTravelPlan(updatedPlan).catch(console.error);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="no-current-plan">
                  <p>
                    No active plan. Generate one on the Home page or view your
                    history below.
                  </p>
                </div>
              )}

              {/* Show previous trips history */}
              {user && (
                <div className="history-section">
                  <div className="section-divider"></div>
                  <PreviousTrips
                    onSelectTrip={(planData) => {
                      setTravelPlan(planData);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              )}
            </div>
          )}


          {/* Budget Section */}
          {activeSection === "budget" && (
            <BudgetPage
              travelPlan={consolidatedPlan}
              onUpdatePlan={(updatedPlan) => {
                setTravelPlan(updatedPlan);
                // Also save to backend if user logged in
                if (user) {
                  authService.saveTravelPlan(updatedPlan).catch(console.error);
                }
              }}
            />
          )}


          {/* Accommodation Section */}
          {activeSection === "accommodation" && (
            <div>
              <h2>Accommodation Details</h2>
              {consolidatedPlan && consolidatedPlan.accommodation ? (
                <div>
                  <p>
                    Accommodation Type: {consolidatedPlan.accommodation.type}
                  </p>
                  <p>
                    Preferences: {consolidatedPlan.accommodation.preferences}
                  </p>
                  {consolidatedPlan.dailyItinerary && (
                    <div>
                      <h3>Per-Day Accommodation:</h3>
                      {consolidatedPlan.dailyItinerary.map((day, index) => (
                        <div key={index}>
                          <h4>Day {day.dayNumber || day.day || index + 1}</h4>
                          {day.accommodation ? (
                            <p>{day.accommodation}</p>
                          ) : (
                            <p>No accommodation specified for this day</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p>
                  No accommodation information available. Please generate a
                  travel plan first.
                </p>
              )}
            </div>
          )}

          {/* Meals Section */}
          {activeSection === "meals" && (
            <div>
              <h2>Meal Suggestions</h2>
              {consolidatedPlan && consolidatedPlan.dailyItinerary ? (
                <div>
                  {consolidatedPlan.dailyItinerary.map((day, index) => (
                    <div key={index}>
                      <h3>Day {day.dayNumber || day.day || index + 1} Meals</h3>
                      {day.meals && day.meals.length > 0 ? (
                        <ul>
                          {day.meals.map((meal, mealIndex) => (
                            <li key={mealIndex}>{meal}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No meal suggestions for this day</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>
                  No meal information available. Please generate a travel plan
                  first.
                </p>
              )}
            </div>
          )}
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
    </>
  );
}

export default App;
