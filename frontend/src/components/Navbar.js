import React from "react";
import "./Navbar.css";

const Navbar = ({
  activeSection,
  setActiveSection,
  user,
  onLogin,
  onRegister,
  onLogout,
}) => {
  const navItems = [
    { id: "home", label: "Home" },
    { id: "itinerary", label: "Itinerary" },
    { id: "budget", label: "Budget" },
    { id: "accommodation", label: "Accommodation" },
    { id: "meals", label: "Meal Suggestions" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span>✈️</span>
        Wanderly
      </div>

      <div className="navbar-nav">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`navbar-link ${
              activeSection === item.id ? "active" : ""
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
            <a href="#profile" className="user-profile">
              <span>👤</span>
              {user.name || user.email}
            </a>
            <button className="settings-btn" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="settings-btn" onClick={onLogin}>
              Login
            </button>
            <button className="settings-btn" onClick={onRegister}>
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
