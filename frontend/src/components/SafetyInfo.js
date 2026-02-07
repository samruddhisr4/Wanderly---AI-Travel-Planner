import React, { useState } from "react";
import "./SafetyInfo.css";

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
};

const SafetyInfo = ({ safetyData }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  if (!safetyData) {
    return (
      <div className="safety-info">
        <div className="no-safety">
          <h3>Safety Information</h3>
          <p>No safety data available for this destination</p>
        </div>
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatPhoneNumber = (number) => {
    // Simple formatting - can be enhanced based on actual phone number formats
    return number.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  };

  return (
    <div className="safety-info">
      <div className="safety-header">
        <h2>🛡️ Safety Information</h2>
        <p>Essential safety guidelines for your trip</p>
      </div>

      {/* Women Specific Safety Section */}
      {safetyData.womenSpecific && (
        <div className="safety-section">
          <div
            className="section-header"
            onClick={() => toggleSection("women")}
          >
            <h3>Women's Safety</h3>
            <span
              className={`toggle-icon ${
                expandedSection === "women" ? "expanded" : ""
              }`}
            >
              ▼
            </span>
          </div>

          {expandedSection === "women" && (
            <div className="section-content">
              {/* Helpline Information */}
              {safetyData.womenSpecific.helpline && (
                <div className="helpline-card">
                  <h4>🚨 Emergency Helpline</h4>
                  <div className="helpline-info">
                    <div className="helpline-number">
                      <span className="label">Number:</span>
                      <span className="number">
                        {formatPhoneNumber(
                          safetyData.womenSpecific.helpline.number,
                        )}
                      </span>
                    </div>
                    <div className="helpline-service">
                      <span className="label">Service:</span>
                      <span className="service">
                        {safetyData.womenSpecific.helpline.service}
                      </span>
                    </div>
                    {safetyData.womenSpecific.helpline.website && (
                      <div className="helpline-website">
                        <span className="label">Website:</span>
                        <a
                          href={`https://${safetyData.womenSpecific.helpline.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {safetyData.womenSpecific.helpline.website}
                        </a>
                      </div>
                    )}
                    {safetyData.womenSpecific.helpline.notes && (
                      <div className="helpline-notes">
                        <span className="label">Notes:</span>
                        <span className="notes">
                          {safetyData.womenSpecific.helpline.notes}
                        </span>
                      </div>
                    )}
                    {safetyData.womenSpecific.helpline.available247 && (
                      <div className="availability">
                        <span className="available-badge">Available 24/7</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Safer Areas */}
              {safetyData.womenSpecific.saferAreas &&
                safetyData.womenSpecific.saferAreas.length > 0 && (
                  <div className="safer-areas">
                    <h4>📍 Recommended Safer Areas</h4>
                    <ul>
                      {safetyData.womenSpecific.saferAreas.map(
                        (area, index) => (
                          <li key={index}>
                            <span className="area-name">{area}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {/* Cultural Considerations */}
              {safetyData.womenSpecific.culturalConsiderations &&
                safetyData.womenSpecific.culturalConsiderations.length > 0 && (
                  <div className="cultural-considerations">
                    <h4>🌍 Cultural Considerations</h4>
                    <ul>
                      {safetyData.womenSpecific.culturalConsiderations.map(
                        (consideration, index) => (
                          <li key={index}>{consideration}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {/* Emergency Contacts */}
              {safetyData.womenSpecific.emergencyContacts &&
                safetyData.womenSpecific.emergencyContacts.length > 0 && (
                  <div className="emergency-contacts">
                    <h4>📞 Additional Emergency Contacts</h4>
                    <div className="contacts-list">
                      {safetyData.womenSpecific.emergencyContacts.map(
                        (contact, index) => (
                          <div key={index} className="contact-item">
                            <span className="contact-type">
                              {contact.type}:
                            </span>
                            <span className="contact-number">
                              {contact.number}
                            </span>
                            {contact.description && (
                              <span className="contact-description">
                                {contact.description}
                              </span>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* General Safety Guidelines */}
      {safetyData.generalGuidelines &&
        safetyData.generalGuidelines.length > 0 && (
          <div className="safety-section">
            <div
              className="section-header"
              onClick={() => toggleSection("general")}
            >
              <h3>General Safety Guidelines</h3>
              <span
                className={`toggle-icon ${
                  expandedSection === "general" ? "expanded" : ""
                }`}
              >
                ▼
              </span>
            </div>

            {expandedSection === "general" && (
              <div className="section-content">
                <ul className="guidelines-list">
                  {safetyData.generalGuidelines.map((guideline, index) => (
                    <li key={index}>{guideline}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      {/* Disclaimer */}
      {safetyData.disclaimer && (
        <div className="safety-disclaimer">
          <div className="disclaimer-icon">ℹ️</div>
          <div className="disclaimer-content">
            <h4>Important Disclaimer</h4>
            <p>{safetyData.disclaimer}</p>
          </div>
        </div>
      )}

      {/* Quick Safety Tips */}
      <div className="quick-tips">
        <h3>⚡ Quick Safety Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">📱</span>
            <span className="tip-text">Save emergency contacts</span>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🏨</span>
            <span className="tip-text">
              Choose well-reviewed accommodations
            </span>
          </div>
          <div className="tip-card">
            <span className="tip-icon">👥</span>
            <span className="tip-text">
              Share itinerary with trusted contacts
            </span>
          </div>
          <div className="tip-card">
            <span className="tip-icon">💡</span>
            <span className="tip-text">Trust your instincts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyInfo;
