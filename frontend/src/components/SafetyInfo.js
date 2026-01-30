import React, { useState } from "react";
import "./SafetyInfo.css";

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
                          safetyData.womenSpecific.helpline.number
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
                        )
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
                        )
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
                        )
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
