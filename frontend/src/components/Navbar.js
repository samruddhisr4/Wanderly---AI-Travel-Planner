import React, { useState } from "react";
import SettingsModal from "./SettingsModal";
import "./Navbar.css";

const Navbar = ({
  activeSection,
  setActiveSection,
  user,
  onLogin,
  onRegister,
  onLogout,
  onSelectTrip,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "itinerary", label: "Itinerary" },
    { id: "budget", label: "Budget" },
    { id: "accommodation", label: "Accommodation" },
    { id: "meals", "label": "Meals" },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <a href="#home" className="navbar-logo-link">
            <h1 style={{ fontFamily: "Broadway", margin: 0, color: "white" }}>Wanderly</h1>
          </a>
        </div>

        <div className="navbar-right">
          <div className="navbar-nav">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`navbar-link ${activeSection === item.id ? "active" : ""
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection(item.id);
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="navbar-user-section">
            {user ? (
              <>
                <button
                  className="user-profile settings-btn"
                  onClick={() => setShowSettings(true)}
                  style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", color: "white", fontSize: "1rem" }}
                >

                  {user.name || user.email}
                </button>
              </>
            ) : (
              <>
                <button className="settings-btn" onClick={onLogin}>
                  Login
                </button>
                <button
                  className="settings-btn register-btn"
                  onClick={onRegister}
                >
                  Register
                </button>
              </>
            )}
          </div>
          {/* <span style={{ backgroundColor: "black", width: "100%" }}></span> */}
        </div>
      </nav>

      {showSettings && (
        <SettingsModal
          user={user}
          onClose={() => setShowSettings(false)}
          onLogout={onLogout}
          onSelectTrip={(plan) => {
            if (onSelectTrip) {
              onSelectTrip(plan);
            }
            // Also switch to itinerary section if not already
            setActiveSection("itinerary");
          }}
        />
      )}
    </>
  );
};

export default Navbar;
