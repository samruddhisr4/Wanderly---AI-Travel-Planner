import React from "react";
import PreviousTrips from "./PreviousTrips";
import "./SettingsModal.css";

const SettingsModal = ({ user, onClose, onLogout, onSelectTrip }) => {
    if (!user) return null;

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div
                className="settings-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="settings-modal-header">
                    <h2>User Profile</h2>
                    <button className="close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="user-info-section">
                    <div className="user-avatar-large">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="user-details">
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                    </div>
                </div>

                <div className="settings-modal-body">
                    {/* Reuse PreviousTrips component */}
                    <PreviousTrips
                        onSelectTrip={(plan) => {
                            onSelectTrip(plan);
                            onClose();
                        }}
                    />
                </div>

                <div className="settings-modal-footer">
                    <button
                        className="logout-btn-large"
                        onClick={() => {
                            onLogout();
                            onClose();
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
